/**
 * R-AR-16 — Contrato estructural de feature.
 *
 * Cada `features/<grupo>/<feature>/` declara en `FEATURE_CONTRACTS` su tipo (`kind`),
 * capas obligatorias y API pública. El sistema de archivos solo admite esas
 * capas más los archivos raíz conocidos. Las páginas y componentes viven en
 * su propia carpeta `<nombre>/<nombre>.component.{ts,html,spec.ts}`.
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
const FEATURE_KINDS = new Set(['application', 'domain', 'module']);
const MODULE_LAYERS = new Set(['pages', 'components']);

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
  const featureEntries = [];
  for (const group of ['applications', 'domains']) {
    const groupDir = join(featuresDir, group);
    if (!existsSync(groupDir)) continue;
    for (const entry of readdirSync(groupDir, { withFileTypes: true }).filter((item) =>
      item.isDirectory(),
    )) {
      featureEntries.push({
        name: entry.name,
        group,
        dir: join(groupDir, entry.name),
        rel: `${FEATURES_ROOT}/${group}/${entry.name}`,
        contractKey: entry.name,
      });
    }
  }
  const modulesDir = join(featuresDir, 'modules');
  if (existsSync(modulesDir)) {
    for (const entry of readdirSync(modulesDir, { withFileTypes: true }).filter((item) =>
      item.isDirectory(),
    )) {
      featureEntries.push({
        name: entry.name,
        group: 'modules',
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

    const isNestedModule = entry.group === 'modules';
    const expectedGroup =
      contract.kind === 'module'
        ? 'modules'
        : contract.kind === 'domain'
          ? 'domains'
          : 'applications';
    if (entry.group !== expectedGroup) {
      add(
        featureRel,
        `el feature de tipo '${contract.kind}' debe vivir bajo features/${expectedGroup}/`,
        'feature-group',
      );
    }
    if (!FEATURE_KINDS.has(contract.kind)) {
      add(
        featureRel,
        `el contrato debe declarar kind como application, domain o module (actual: '${contract.kind ?? 'ausente'}')`,
        'contract-kind',
      );
    } else if (isNestedModule && contract.kind !== 'module') {
      add(
        featureRel,
        `un feature bajo features/modules/ debe declarar kind: 'module' (actual: '${contract.kind}')`,
        'module-kind',
      );
    } else if (!isNestedModule && contract.kind === 'module') {
      add(
        featureRel,
        `un feature directo bajo features/ no puede declarar kind: 'module'`,
        'direct-module-kind',
      );
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

    if (contract.kind !== 'domain') {
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
      if (contract.kind === 'module' && !MODULE_LAYERS.has(layer)) {
        add(
          featureRel,
          `un módulo solo puede contener capas de composición (pages/components), no '${layer}/'`,
          `module-layer|${layer}`,
        );
      }
      if (contract.kind === 'domain' && MODULE_LAYERS.has(layer)) {
        add(
          featureRel,
          `un dominio no puede contener capas de presentación ('${layer}/')`,
          `domain-layer|${layer}`,
        );
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
