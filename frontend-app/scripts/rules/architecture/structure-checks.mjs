/**
 * Guardas estructurales de segundo nivel (R-AR-17/18/19).
 *
 * Estas comprobaciones no sustituyen a TypeScript/ESLint: verifican que las
 * fronteras que hacen legible el proyecto sigan existiendo cuando se añaden
 * features, módulos o scripts nuevos.
 */
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { appRoot, resolveInApp, scriptsRoot } from '../../engine/lib/paths.mjs';
import { extractImports, lineAt, maskComments } from '../../engine/lib/source.mjs';
import { readText, walkFiles } from '../../engine/lib/fs.mjs';
import {
  APP_LAYER_ALLOWED_DIRECTORIES,
  APP_LAYER_ALLOWED_ROOT_FILES,
  APP_ROOT_ALLOWED_DIRECTORIES,
  APP_ROOT_ALLOWED_FILES,
  FEATURE_ALLOWED_DIRECTORIES,
  FEATURE_GROUP_ALLOWED_ROOT_FILES,
  FEATURE_CONTRACTS,
  ROUTES_FILE,
  SCRIPTS_ALLOWED_DIRECTORIES,
  SCRIPTS_ALLOWED_ROOT_FILES,
} from '../../config/project.mjs';

const toRel = (file) => relative(appRoot, file).split(sep).join('/');
const scriptsToRel = (file) => relative(scriptsRoot, file).split(sep).join('/');

const finding = (rule, file, line, detail, suffix) => ({
  rule,
  file,
  line,
  detail,
  key: `${file}|${rule}|${suffix}`,
});

function directoryEntries(directory) {
  return readdirSync(directory, { withFileTypes: true });
}

/** Verifica las fronteras de primer nivel de `src/app/`. */
export function findApplicationStructureViolations() {
  const findings = [];
  const appDir = resolveInApp('src/app');

  for (const entry of directoryEntries(appDir)) {
    const allowed = entry.isDirectory()
      ? APP_ROOT_ALLOWED_DIRECTORIES.has(entry.name)
      : APP_ROOT_ALLOWED_FILES.has(entry.name);
    if (!allowed) {
      findings.push(
        finding(
          'R-AR-17',
          `src/app/${entry.name}`,
          0,
          `${entry.isDirectory() ? 'directorio' : 'archivo'} no permitido directamente bajo src/app/`,
          `app-root|${entry.name}`,
        ),
      );
    }
  }

  for (const [layer, allowedDirectories] of Object.entries(APP_LAYER_ALLOWED_DIRECTORIES)) {
    const layerDir = join(appDir, layer);
    if (!existsSync(layerDir)) continue;

    for (const entry of directoryEntries(layerDir)) {
      const allowed = entry.isDirectory()
        ? allowedDirectories.has(entry.name)
        : APP_LAYER_ALLOWED_ROOT_FILES.has(entry.name);
      if (!allowed) {
        findings.push(
          finding(
            'R-AR-17',
            `src/app/${layer}/${entry.name}`,
            0,
            `${entry.isDirectory() ? 'directorio' : 'archivo'} no permitido directamente bajo ${layer}/`,
            `${layer}-root|${entry.name}`,
          ),
        );
      }
    }
  }

  const featuresDir = join(appDir, 'features');
  if (existsSync(featuresDir)) {
    for (const entry of directoryEntries(featuresDir)) {
      const allowed = entry.isDirectory()
        ? FEATURE_ALLOWED_DIRECTORIES.has(entry.name)
        : FEATURE_GROUP_ALLOWED_ROOT_FILES.has(entry.name);
      if (!allowed) {
        findings.push(
          finding(
            'R-AR-17',
            `src/app/features/${entry.name}`,
            0,
            `${entry.isDirectory() ? 'directorio' : 'archivo'} no permitido directamente bajo features/; usa applications/, domains/ o modules/`,
            `features-root|${entry.name}`,
          ),
        );
      }
    }

    for (const group of FEATURE_ALLOWED_DIRECTORIES) {
      const groupDir = join(featuresDir, group);
      if (!existsSync(groupDir)) continue;
      for (const entry of directoryEntries(groupDir)) {
        if (!entry.isDirectory() && !FEATURE_GROUP_ALLOWED_ROOT_FILES.has(entry.name)) {
          findings.push(
            finding(
              'R-AR-17',
              `src/app/features/${group}/${entry.name}`,
              0,
              `archivo no permitido directamente bajo features/${group}/`,
              `feature-group-root|${group}|${entry.name}`,
            ),
          );
        }
      }
    }
  }

  return findings;
}

/**
 * Comprueba que `public-api` no exponga UI accidentalmente. La UI pública
 * debe vivir en `public-ui.ts`, mientras `public-api.ts` conserva contratos,
 * modelos, estado y servicios reutilizables.
 */
export function findPublicSurfaceViolations() {
  const findings = [];
  const featureFiles = walkFiles(resolveInApp('src/app/features'), (name) =>
    /public-(api|ui)\.ts$/.test(name),
  );

  for (const file of featureFiles) {
    const rel = toRel(file);
    const isApi = rel.endsWith('/public-api.ts');
    const masked = maskComments(readText(file));
    const exportFrom = /\bexport\s+(?:type\s+)?[^;\n]*?\s+from\s+['"]([^'"]+)['"]/g;

    for (const match of masked.matchAll(exportFrom)) {
      const specifier = match[1];
      const exposesUi = /\/(?:pages|components)\//.test(specifier);
      if (isApi && exposesUi) {
        findings.push(
          finding(
            'R-AR-18',
            rel,
            lineAt(masked, match.index),
            `public-api.ts expone UI desde '${specifier}'; usa public-ui.ts`,
            `api-ui|${specifier}`,
          ),
        );
      }
      if (!isApi && !exposesUi) {
        findings.push(
          finding(
            'R-AR-18',
            rel,
            lineAt(masked, match.index),
            `public-ui.ts expone una dependencia que no es UI: '${specifier}'`,
            `ui-domain|${specifier}`,
          ),
        );
      }
    }
  }

  return findings;
}

/** Verifica que las rutas mantengan la frontera lazy/presentacional. */
export function findRouteArchitectureViolations() {
  const findings = [];
  const routeFiles = walkFiles(resolveInApp('src/app'), (name) => ROUTES_FILE.test(name));

  for (const file of routeFiles) {
    const rel = toRel(file);
    const src = readText(file);
    const masked = maskComments(src);

    if (/\bcomponent\s*:/.test(masked)) {
      findings.push(
        finding(
          'R-AR-18',
          rel,
          lineAt(masked, masked.search(/\bcomponent\s*:/)),
          'declara component: estático; usa loadComponent para conservar lazy loading',
          'static-component',
        ),
      );
    }

    const staticPageOrComponent =
      /(?:^|\n)\s*(?:import|export)\s+[^;\n]*\s+from\s+['"][^'"]+\/(?:pages|components)\//m.exec(
        masked,
      );
    if (staticPageOrComponent) {
      findings.push(
        finding(
          'R-AR-18',
          rel,
          lineAt(masked, staticPageOrComponent.index),
          'importa una página/componente de forma estática desde un archivo de rutas',
          'static-page-import',
        ),
      );
    }
  }

  return findings;
}

function resolveScriptImport(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = join(dirname(fromFile), specifier);
  for (const candidate of [base, `${base}.mjs`, join(base, 'index.mjs')]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Comprueba el propio motor: engine es genérico, config es declarativa,
 * commands contiene utilidades ejecutables y rules es la capa de composición
 * que puede consumir engine/config.
 */
export function findScriptsArchitectureViolations() {
  const findings = [];
  const rootEntries = directoryEntries(scriptsRoot);

  for (const entry of rootEntries) {
    const allowed = entry.isDirectory()
      ? SCRIPTS_ALLOWED_DIRECTORIES.has(entry.name)
      : SCRIPTS_ALLOWED_ROOT_FILES.has(entry.name);
    if (!allowed) {
      findings.push(
        finding(
          'R-AR-19',
          `scripts/${entry.name}`,
          0,
          `${entry.isDirectory() ? 'directorio' : 'archivo'} no permitido directamente bajo scripts/`,
          `scripts-root|${entry.name}`,
        ),
      );
    }
  }

  for (const file of walkFiles(scriptsRoot, (name) => name.endsWith('.mjs'))) {
    const rel = scriptsToRel(file);
    if (rel.startsWith('node_modules/')) continue;

    const layer = rel.startsWith('commands/')
      ? 'commands'
      : rel.startsWith('engine/')
        ? 'engine'
        : rel.startsWith('config/')
          ? 'config'
          : rel.startsWith('rules/')
            ? 'rules'
            : 'root';

    if (layer === 'root') continue;

    const source = readText(file);
    for (const { specifier, line } of extractImports(source)) {
      const target = resolveScriptImport(file, specifier);
      if (!target) continue;
      const targetRel = scriptsToRel(target);
      const targetLayer = targetRel.startsWith('commands/')
        ? 'commands'
        : targetRel.startsWith('engine/')
          ? 'engine'
          : targetRel.startsWith('config/')
            ? 'config'
            : targetRel.startsWith('rules/')
              ? 'rules'
              : 'root';

      const allowed =
        layer === 'commands'
          ? targetLayer === 'commands' || targetLayer === 'engine' || targetLayer === 'config'
          : layer === 'engine'
            ? targetLayer === 'engine'
            : layer === 'config'
              ? targetLayer === 'config'
              : targetLayer === 'rules' || targetLayer === 'engine' || targetLayer === 'config';

      if (!allowed) {
        findings.push(
          finding(
            'R-AR-19',
            `scripts/${rel}`,
            line,
            `${layer}/ no puede depender de ${targetLayer}/ (${specifier})`,
            `dependency|${targetRel}`,
          ),
        );
      }
    }

    if (layer === 'rules' && rel.endsWith('.test.mjs') && !/defineSuite\s*\(/.test(source)) {
      findings.push(
        finding(
          'R-AR-19',
          `scripts/${rel}`,
          0,
          'una suite de rules debe declarar defineSuite(...)',
          'suite-contract',
        ),
      );
    }
  }

  return findings;
}

/** Comprueba que todos los contratos declarados sigan teniendo una carpeta. */
export function findContractPathViolations() {
  const findings = [];
  for (const feature of Object.keys(FEATURE_CONTRACTS)) {
    const contract = FEATURE_CONTRACTS[feature];
    const parts = feature.split('/');
    const isModule = parts.length === 2 && parts[0] === 'modules';
    const group = isModule ? 'modules' : contract.kind === 'domain' ? 'domains' : 'applications';
    const featureName = isModule ? parts[1] : parts[0];
    const directory = resolveInApp('src/app/features', group, featureName);
    if (!existsSync(directory)) {
      findings.push(
        finding(
          'R-AR-17',
          `src/app/features/${group}/${featureName}`,
          0,
          `contrato declarado sin directorio correspondiente: ${feature}`,
          `contract-path|${feature}`,
        ),
      );
    }
  }
  return findings;
}
