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
  lineAt,
  maskComments,
  maskSource,
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
const listHtml = () => walkFiles(srcRoot, (name) => name.endsWith('.html'));
const isSpec = (rel) => rel.endsWith('.spec.ts');

/** Clasifica una ruta (`src/app/...`) por ámbito y capa. */
export function classify(rel) {
  if (COMPOSITION_FILES.has(rel)) return { kind: 'composition' };
  if (rel.startsWith('src/app/core/')) return { kind: 'core', layer: rel.split('/')[3] };
  if (rel.startsWith('src/app/shared/')) return { kind: 'shared', layer: rel.split('/')[3] };
  if (rel.startsWith('src/app/layout/')) return { kind: 'layout', layer: rel.split('/')[3] };

  const parts = rel.split('/');
  if (parts[0] === 'src' && parts[1] === 'app' && parts[2] === 'features') {
    // `features/modules/<module>/` es un feature de composición anidado, no
    // una capa llamada `modules`. Mantener esta identidad evita que sus
    // páginas/componentes queden fuera del grafo de dependencias.
    if (parts[3] === 'modules' && parts[4]) {
      const feature = `modules/${parts[4]}`;
      if (parts.length === 6) return { kind: 'feature-root', feature, file: parts[5] };
      return { kind: 'feature', feature, layer: parts[5] };
    }

    if (parts[3]) {
      const feature = parts[3];
      if (parts.length === 5) return { kind: 'feature-root', feature, file: parts[4] };
      return { kind: 'feature', feature, layer: parts[4] };
    }
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

/**
 * Hallazgos de guardas de arquitectura: R-AR-7 (ngModel/FormsModule),
 * R-AR-9 (diálogos nativos) y R-AR-10 (subscribe sin limpieza en
 * páginas/componentes).
 */
export function findProhibitedApiViolations() {
  const findings = [];
  const add = (rule, rel, line, detail, suffix) => {
    findings.push({
      rule,
      file: rel,
      line,
      detail,
      key: `${rel}|${rule}|${suffix}`,
    });
  };

  for (const file of listTs()) {
    const rel = toRel(file);
    if (isSpec(rel)) continue;
    const masked = maskSource(readText(file));

    if (/\bngModel\b|\bFormsModule\b/.test(masked)) {
      add('R-AR-7', rel, 0, 'usa ngModel/FormsModule en lógica de negocio', 'ngModel');
    }

    for (const match of masked.matchAll(/\bwindow\s*\.\s*(alert|confirm|prompt)\s*\(/g)) {
      add('R-AR-9', rel, lineAt(masked, match.index), `usa window.${match[1]} nativo`, match[1]);
    }

    for (const match of masked.matchAll(/(?:^|[^.\w])(alert|confirm|prompt)\s*\(/g)) {
      const line = lineAt(masked, match.index);
      const lineText = masked.split('\n')[line - 1] ?? '';
      if (/\)\s*:/.test(lineText)) continue; // declaración de método
      add('R-AR-9', rel, line, `usa ${match[1]} nativo`, match[1]);
    }

    if (/\/(pages|components)\//.test(rel) && /\.subscribe\s*\(/.test(masked)) {
      if (!/takeUntilDestroyed|takeUntil|DestroyRef|async\b/.test(masked)) {
        add(
          'R-AR-10',
          rel,
          0,
          'subscribe sin takeUntilDestroyed/takeUntil/DestroyRef',
          'subscribe',
        );
      }
    }
  }

  for (const file of listHtml()) {
    const rel = toRel(file);
    const html = readText(file).replace(/<!--[\s\S]*?-->/g, (comment) =>
      comment.replace(/[^\n]/g, ' '),
    );
    if (/\bngModel\b/.test(html)) add('R-AR-7', rel, 0, 'usa ngModel en plantilla', 'ngModel');
  }

  return findings;
}

/**
 * Hallazgos de R-AR-15: componentes y directivas sin `constructor` ni hooks de
 * ciclo de vida (`ngOnInit`/`ngOnDestroy`). La DI va con `inject()`, la
 * inicialización en *field initializers* o `effect()` y la limpieza con
 * `DestroyRef.onDestroy()`/`takeUntilDestroyed()`.
 */
export function findLifecycleViolations() {
  const findings = [];
  const hooks = [
    { name: 'constructor', pattern: /\bconstructor\s*\(/g },
    { name: 'ngOnInit', pattern: /\bngOnInit\s*\(/g },
    { name: 'ngOnDestroy', pattern: /\bngOnDestroy\s*\(/g },
  ];

  for (const file of listTs()) {
    const rel = toRel(file);
    if (isSpec(rel)) continue;

    const masked = maskSource(readText(file));
    const isComponent = /@(?:Component|Directive)\s*\(/.test(masked);
    if (!isComponent) continue;

    for (const { name, pattern } of hooks) {
      pattern.lastIndex = 0;
      const match = pattern.exec(masked);
      if (!match) continue;

      findings.push({
        rule: 'R-AR-15',
        file: rel,
        line: lineAt(masked, match.index),
        detail: `${name} en componente/directiva (usa inject/field initializer/DestroyRef)`,
        key: `${rel}|R-AR-15|${name}`,
      });
    }
  }

  return findings;
}
