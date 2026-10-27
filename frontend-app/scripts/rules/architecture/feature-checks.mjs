/**
 * R-AR-16 — Contrato estructural de feature.
 *
 * Cada `features/<feature>/` declara en `FEATURE_CONTRACTS` sus capas
 * obligatorias y su API pública. El sistema de archivos solo admite esas capas
 * más los archivos raíz conocidos. Las páginas y componentes viven en su propia
 * carpeta `<nombre>/<nombre>.component.{ts,html,spec.ts}`.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { appRoot, resolveInApp } from '../../engine/lib/paths.mjs';
import { readText } from '../../engine/lib/fs.mjs';
import {
  FEATURE_ALLOWED_LAYERS,
  FEATURE_ALLOWED_ROOT_FILES,
  FEATURE_CONTRACTS,
} from '../../config/project.mjs';

const FEATURES_ROOT = 'src/app/features';
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const toRel = (path) => relative(appRoot, path).split(sep).join('/');

function hasFile(dir, file) {
  return existsSync(join(dir, file));
}

function checkUnit({ findings, featureRel, layer, unitName, unitDir }) {
  for (const suffix of ['component.ts', 'component.html', 'component.spec.ts']) {
    const file = `${unitName}.${suffix}`;
    if (!hasFile(unitDir, file)) {
      findings.push({
        rule: 'R-AR-16',
        file: `${featureRel}/${layer}/${unitName}`,
        line: 0,
        detail: `falta ${file} en ${layer}/${unitName}/`,
        key: `${featureRel}|R-AR-16|${layer}-file|${unitName}|${suffix}`,
      });
    }
  }
}

/** Hallazgos de R-AR-16 en todos los features. */
export function findFeatureStructureViolations() {
  const findings = [];
  const featuresDir = resolveInApp(FEATURES_ROOT);
  const featureEntries = readdirSync(featuresDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'modules')
    .map((entry) => ({
      name: entry.name,
      dir: join(featuresDir, entry.name),
      rel: `${FEATURES_ROOT}/${entry.name}`,
      contractKey: entry.name,
    }));
  const modulesDir = join(featuresDir, 'modules');
  if (existsSync(modulesDir)) {
    for (const entry of readdirSync(modulesDir, { withFileTypes: true }).filter((item) =>
      item.isDirectory(),
    )) {
      featureEntries.push({
        name: entry.name,
        dir: join(modulesDir, entry.name),
        rel: `${FEATURES_ROOT}/modules/${entry.name}`,
        contractKey: `modules/${entry.name}`,
      });
    }
  }
  featureEntries.sort((a, b) => a.contractKey.localeCompare(b.contractKey));
  const discoveredContracts = featureEntries.map((entry) => entry.contractKey);

  const add = (rel, detail, key) => {
    findings.push({
      rule: 'R-AR-16',
      file: rel,
      line: 0,
      detail,
      key: `${rel}|R-AR-16|${key}`,
    });
  };

  for (const entry of featureEntries) {
    const feature = entry.name;
    const featureDir = entry.dir;
    const featureRel = entry.rel;
    const contract = FEATURE_CONTRACTS[entry.contractKey];

    if (!KEBAB_CASE.test(feature)) {
      add(featureRel, `el nombre del feature '${feature}' no es kebab-case`, 'feature-name');
    }

    if (!contract) {
      add(
        featureRel,
        `el feature no declara contrato en FEATURE_CONTRACTS ('${entry.contractKey}')`,
        'missing-contract',
      );
      continue;
    }

    const entries = readdirSync(featureDir, { withFileTypes: true });
    const actualLayers = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    const actualFiles = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
    const routesFile = `${feature}.routes.ts`;

    for (const layer of contract.layers) {
      if (!FEATURE_ALLOWED_LAYERS.has(layer)) {
        add(
          featureRel,
          `el contrato declara una capa desconocida: ${layer}`,
          `contract-layer|${layer}`,
        );
      }
    }

    if (!contract.domainOnly) {
      if (!actualFiles.includes(routesFile)) {
        add(featureRel, `falta ${routesFile}`, 'missing-routes');
      } else {
        const routes = readText(join(featureDir, routesFile));
        if (!/load(Component|Children)\s*:/.test(routes)) {
          add(
            `${featureRel}/${routesFile}`,
            'las rutas no declaran loadComponent/loadChildren',
            'routes-lazy',
          );
        }
      }
    }

    for (const layer of contract.layers) {
      if (!actualLayers.includes(layer)) {
        add(featureRel, `falta la capa obligatoria '${layer}/'`, `missing-layer|${layer}`);
        continue;
      }
      if (readdirSync(join(featureDir, layer)).length === 0) {
        add(featureRel, `la capa '${layer}/' está vacía`, `empty-layer|${layer}`);
      }
    }

    for (const layer of actualLayers) {
      if (!contract.layers.includes(layer)) {
        add(featureRel, `capa no declarada en el contrato: '${layer}/'`, `extra-layer|${layer}`);
      }
    }

    for (const file of actualFiles) {
      if (file === routesFile || FEATURE_ALLOWED_ROOT_FILES.has(file)) continue;
      add(
        featureRel,
        `archivo no permitido en la raíz del feature: '${file}'`,
        `root-file|${file}`,
      );
    }

    for (const [flag, fileName] of [
      ['publicApi', 'public-api.ts'],
      ['publicUi', 'public-ui.ts'],
    ]) {
      const exists = actualFiles.includes(fileName);
      if (contract[flag] && !exists) {
        add(featureRel, `falta ${fileName} declarado en el contrato`, `missing-${fileName}`);
      }
      if (!contract[flag] && exists) {
        add(featureRel, `${fileName} no está declarado en el contrato`, `undeclared-${fileName}`);
      }
    }

    const pagesDir = join(featureDir, 'pages');
    if (existsSync(pagesDir)) {
      for (const entry of readdirSync(pagesDir, { withFileTypes: true })) {
        if (entry.isFile()) {
          add(
            `${featureRel}/pages`,
            `archivo suelto en pages/: '${entry.name}'`,
            `loose-page|${entry.name}`,
          );
          continue;
        }
        if (!KEBAB_CASE.test(entry.name)) {
          add(
            `${featureRel}/pages`,
            `la página '${entry.name}' no es kebab-case`,
            `page-name|${entry.name}`,
          );
        }
        checkUnit({
          findings,
          featureRel,
          layer: 'pages',
          unitName: entry.name,
          unitDir: join(pagesDir, entry.name),
        });
      }
    }

    const componentsDir = join(featureDir, 'components');
    if (existsSync(componentsDir)) {
      for (const entry of readdirSync(componentsDir, { withFileTypes: true })) {
        if (entry.isFile()) {
          add(
            `${featureRel}/components`,
            `archivo suelto en components/: '${entry.name}'`,
            `loose-component|${entry.name}`,
          );
          continue;
        }
        if (!KEBAB_CASE.test(entry.name)) {
          add(
            `${featureRel}/components`,
            `el componente '${entry.name}' no es kebab-case`,
            `component-name|${entry.name}`,
          );
        }
        checkUnit({
          findings,
          featureRel,
          layer: 'components',
          unitName: entry.name,
          unitDir: join(componentsDir, entry.name),
        });
      }
    }
  }

  for (const feature of Object.keys(FEATURE_CONTRACTS)) {
    if (!discoveredContracts.includes(feature)) {
      add(
        `${FEATURES_ROOT}/${feature}`,
        `el contrato apunta a un feature inexistente: '${feature}'`,
        'orphan-contract',
      );
    }
  }

  return findings;
}
