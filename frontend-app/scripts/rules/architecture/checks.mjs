/**
 * Chequeos arquitectónicos puros (sin `node:test`). Cada uno devuelve hallazgos
 * normalizados `{ rule, file, line, detail, key }`; las suites los aplican y el
 * comando `rules:baseline` los usa para regenerar la deuda aceptada.
 *
 * Las claves (`key`) son estables: identifican el hallazgo, no su posición.
 */
import { existsSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { appRoot, resolveInApp } from '../../engine/lib/paths.mjs';
import { readText, walkFiles } from '../../engine/lib/fs.mjs';
import {
  extractImports,
  extractInjections,
  extractTypeDeclarations,
  hasRuntimeCode,
  injectsHttpClient,
  isDerivedConstType,
  maskComments,
} from '../../engine/lib/source.mjs';
import {
  APP_SRC_DIR,
  COMPOSITION_FILES,
  FEATURE_LAYER_DEPENDENCIES,
  FEATURE_ROOT_FILES,
  HARDCODED_URL_ALLOWLIST,
  HTTP_CLIENT_ALLOWED,
  MIN_UNIT_FILES,
  ROUTES_FILE,
  TYPE_DECLARATION_FILE_PATTERNS,
  UNIT_LAYERS,
} from '../../config/project.mjs';

const srcRoot = resolveInApp(APP_SRC_DIR);

const toRel = (file) => relative(appRoot, file).split(sep).join('/');
const listTs = () => walkFiles(srcRoot, (name) => name.endsWith('.ts'));
const isSpec = (rel) => rel.endsWith('.spec.ts');

/** Clasifica una ruta (`src/app/...`) por ámbito y capa. */
export function classify(rel) {
  if (COMPOSITION_FILES.has(rel)) return { kind: 'composition' };
  if (rel.startsWith('src/app/core/')) return { kind: 'core', layer: rel.split('/')[3] };
  if (rel.startsWith('src/app/shared/')) return { kind: 'shared', layer: rel.split('/')[3] };
  if (rel.startsWith('src/app/layout/')) return { kind: 'layout', layer: rel.split('/')[3] };

  const parts = rel.split('/');
  if (parts[0] === 'src' && parts[1] === 'app' && parts[2] === 'features' && parts[3]) {
    const feature = parts[3];
    if (parts.length === 5) return { kind: 'feature-root', feature, file: parts[4] };
    return { kind: 'feature', feature, layer: parts[4] };
  }

  return { kind: 'other' };
}

const isTypeDeclarationFile = (rel, src) =>
  TYPE_DECLARATION_FILE_PATTERNS.some((pattern) => pattern.test(rel)) || !hasRuntimeCode(src);

/** Resuelve un import relativo a un archivo `.ts` existente. */
function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), specifier);
  for (const candidate of [base, `${base}.ts`, join(base, 'index.ts')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return `${base}.ts`;
}

/** Hallazgos de R-NC-13: declaraciones de tipo fuera de archivos dedicados. */
export function findTypeDeclarations() {
  const findings = [];

  for (const file of listTs()) {
    const rel = toRel(file);
    if (isSpec(rel)) continue;

    const src = readText(file);
    if (isTypeDeclarationFile(rel, src)) continue;

    for (const declaration of extractTypeDeclarations(src)) {
      if (declaration.kind === 'type' && isDerivedConstType(src, declaration)) {
        continue;
      }

      findings.push({
        rule: 'R-NC-13',
        file: rel,
        line: declaration.line,
        detail: `${declaration.kind} ${declaration.name}`,
        key: `${rel}:${declaration.name}`,
      });
    }
  }

  return findings;
}

/** Hallazgos de dirección de dependencias (R-AR-2/3/8, R-CX-1/4/6, R-SO-8). */
export function findLayerViolations() {
  const findings = [];
  const seen = new Set();

  const add = (rule, file, line, detail, key) => {
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({ rule, file, line, detail, key });
  };

  for (const file of listTs()) {
    const rel = toRel(file);
    if (isSpec(rel)) continue;

    const src = readText(file);
    const source = classify(rel);

    if (source.kind === 'composition' || source.kind === 'other') continue;

    // Los archivos de rutas son puntos de composición del feature (componen
    // guards/resolvers de otros features); no se les aplica la dirección de capas.
    if (ROUTES_FILE.test(rel)) continue;

    if (!HTTP_CLIENT_ALLOWED.some((pattern) => pattern.test(rel)) && injectsHttpClient(src)) {
      add('R-AR-8', rel, 0, 'inyecta HttpClient fuera de services/', `${rel}|R-AR-8|HttpClient`);
    }

    // Presentación (pages/components) consume estado, no puertos de dominio,
    // aunque el token llegue re-exportado por un public-api.
    if (source.kind === 'feature' && (source.layer === 'pages' || source.layer === 'components')) {
      for (const { token, line } of extractInjections(src)) {
        if (/(_REPOSITORY|_PORT)$/.test(token)) {
          add(
            'R-SO-8',
            rel,
            line,
            `inyecta el puerto '${token}' en ${source.layer}/ (debe consumir un store)`,
            `${rel}|R-SO-8|${token}`,
          );
        }
      }
    }

    for (const { specifier, line } of extractImports(src)) {
      const targetFile = resolveImport(file, specifier);
      if (!targetFile) {
        // Import externo: el dominio (models/) no debe depender de Angular/rxjs.
        if (source.kind === 'feature' && source.layer === 'models') {
          if (
            specifier.startsWith('@angular/') ||
            specifier === 'rxjs' ||
            specifier.startsWith('rxjs/')
          ) {
            add(
              'R-CX-4',
              rel,
              line,
              `models/ importa dependencia externa '${specifier}'`,
              `${rel}|R-CX-4|${specifier}`,
            );
          }
        }
        continue;
      }

      const targetRel = toRel(targetFile);
      if (targetRel.startsWith('..')) continue;

      const target = classify(targetRel);
      if (target.kind === 'other' || target.kind === 'composition') continue;

      const detail = `→ ${targetRel}`;
      const key = `${rel}|layer|${targetRel}`;

      // Un componente presentacional puede depender de un puerto de
      // infraestructura (p. ej. el API de Leaflet) por su abstracción.
      if (
        source.kind === 'feature' &&
        source.layer === 'components' &&
        targetRel.endsWith('.port.ts')
      ) {
        continue;
      }

      // Fronteras de feature: sólo por API pública (R-CX-6).
      if (
        (source.kind === 'feature' || source.kind === 'feature-root') &&
        (target.kind === 'feature' || target.kind === 'feature-root') &&
        target.feature !== source.feature
      ) {
        const isPublicApi = target.kind === 'feature-root' && FEATURE_ROOT_FILES.has(target.file);
        if (!isPublicApi) {
          add('R-CX-6', rel, line, `importa capa interna de '${target.feature}' ${detail}`, key);
        }
        continue;
      }

      // Fronteras globales (R-AR-2).
      if (
        source.kind === 'core' &&
        ['shared', 'layout', 'feature', 'feature-root'].includes(target.kind)
      ) {
        add('R-AR-2', rel, line, `core/ importa ${target.kind} ${detail}`, key);
        continue;
      }
      if (source.kind === 'shared' && ['layout', 'feature', 'feature-root'].includes(target.kind)) {
        add('R-AR-2', rel, line, `shared/ importa ${target.kind} ${detail}`, key);
        continue;
      }
      if (source.kind === 'layout' && ['feature', 'feature-root'].includes(target.kind)) {
        const isPublicApi = target.kind === 'feature-root' && FEATURE_ROOT_FILES.has(target.file);
        if (!isPublicApi) {
          add('R-AR-2', rel, line, `layout/ importa una capa interna ${detail}`, key);
        }
        continue;
      }

      // Dirección entre capas del MISMO feature.
      if (source.kind === 'feature' && target.kind === 'feature') {
        const allowed = FEATURE_LAYER_DEPENDENCIES[source.layer];
        if (!allowed || allowed.has(target.layer)) continue;

        const rule =
          source.layer === 'components' || source.layer === 'pages'
            ? 'R-SO-8'
            : source.layer === 'state'
              ? 'R-ST-1'
              : 'R-CX-1';
        add(
          rule,
          rel,
          line,
          `${source.layer}/ no puede depender de ${target.layer}/ ${detail}`,
          key,
        );
      }
    }
  }

  return findings;
}

/** Hallazgos de configuración hardcodeada (R-AR-11). */ export function findHardcodedConfig() {
  const findings = [];
  const scannedLayers = new Set(['services', 'state', 'pages', 'components']);

  for (const file of listTs()) {
    const rel = toRel(file);
    if (isSpec(rel)) continue;

    const source = classify(rel);
    if (source.kind !== 'feature' || !scannedLayers.has(source.layer)) continue;

    const masked = maskComments(readText(file));
    const re = /['"`](https?:\/\/[^'"`\s]+)['"`]/g;
    let match;
    while ((match = re.exec(masked))) {
      const url = match[1];
      if (HARDCODED_URL_ALLOWLIST.some((pattern) => pattern.test(url))) continue;
      findings.push({
        rule: 'R-AR-11',
        file: rel,
        line: masked.slice(0, match.index).split('\n').length,
        detail: `URL hardcodeada '${url}'`,
        key: `${rel}|R-AR-11|${url}`,
      });
    }

    if (
      (source.layer === 'pages' || source.layer === 'components') &&
      masked.includes('environment.apiUrl')
    ) {
      findings.push({
        rule: 'R-AR-11',
        file: rel,
        line: 0,
        detail: 'usa environment.apiUrl directamente en presentación',
        key: `${rel}|R-AR-11|environment.apiUrl`,
      });
    }
  }

  return findings;
}

/**
 * Hallazgos de R-AR-14: una unidad lógica con ≥ 2 archivos debe vivir en su
 * propia subcarpeta `<unidad>/` dentro de las carpetas de capa.
 */
export function findPackagingViolations() {
  const findings = [];
  const byDirectory = new Map();

  for (const file of listTs()) {
    const directory = dirname(file);
    const files = byDirectory.get(directory) ?? [];
    files.push(file);
    byDirectory.set(directory, files);
  }

  for (const [directory, files] of byDirectory) {
    if (!UNIT_LAYERS.has(basename(directory))) continue;

    const directoryRel = toRel(directory);
    const units = new Map();
    for (const file of files) {
      const unit = basename(file).split('.')[0];
      const unitFiles = units.get(unit) ?? [];
      unitFiles.push(file);
      units.set(unit, unitFiles);
    }

    for (const [unit, unitFiles] of units) {
      if (unitFiles.length < MIN_UNIT_FILES) continue;
      findings.push({
        rule: 'R-AR-14',
        file: directoryRel,
        line: 0,
        detail: `unidad '${unit}' (${unitFiles.length} archivos) debe vivir en ${directoryRel}/${unit}/`,
        key: `${directoryRel}/${unit}`,
      });
    }
  }

  return findings;
}
