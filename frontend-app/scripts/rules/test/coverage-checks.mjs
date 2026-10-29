/**
 * R-COV-2 — cada archivo de lógica tiene su spec hermano.
 *
 * Aplica a `services/` (excepto `*.port.ts`/`*.types.ts`), `adapters/` (excepto
 * fixtures) y `*.store.ts`. Los puertos (`*.repository.ts`) son tokens sin
 * lógica y quedan fuera.
 */
import { existsSync } from 'node:fs';
import { relative, sep } from 'node:path';
import { appRoot, resolveInApp } from '../../engine/lib/paths.mjs';
import { readText, walkFiles } from '../../engine/lib/fs.mjs';

const srcRoot = resolveInApp('src/app');
const toRel = (path) => relative(appRoot, path).split(sep).join('/');

// Estos adapters transforman estado local del POS, no DTOs del gateway. Se
// excluyen de R-C-8 y mantienen sus propios tests de lógica de dominio.
const LOCAL_ONLY_ADAPTERS = new Set([
  'src/app/features/applications/empresas/adapters/company-catalog/company-catalog.adapter.ts',
  'src/app/features/applications/empresas/adapters/company-sale/company-sale.adapter.ts',
  'src/app/features/applications/empresas/adapters/company-service/company-service.adapter.ts',
]);

/** Hallazgos de R-COV-2. */
export function findMissingSpecs() {
  const findings = [];

  for (const file of walkFiles(
    srcRoot,
    (name) => name.endsWith('.ts') && !name.endsWith('.spec.ts'),
  )) {
    const rel = toRel(file);
    const isLogic =
      (rel.includes('/services/') && !/\.(port|types)\.ts$/.test(rel)) ||
      (rel.includes('/adapters/') && !rel.includes('/fixtures/')) ||
      rel.endsWith('.store.ts');

    if (!isLogic) continue;
    if (!existsSync(file.replace(/\.ts$/, '.spec.ts'))) {
      findings.push({
        rule: 'R-COV-2',
        file: rel,
        line: 0,
        detail: 'archivo de lógica sin spec hermano',
        key: `${rel}|R-COV-2|spec`,
      });
    }
  }

  return findings;
}

/**
 * R-CP-1 — todo componente, y especialmente los que contienen lógica,
 * mantiene un spec hermano ejecutable con TestBed.
 *
 * El guard usa el archivo hermano como frontera estable: no intenta inferir
 * si un componente es "simple" a partir del template, porque esa clasificación
 * cambia con frecuencia y puede esconder una regresión de cobertura.
 */
export function findMissingComponentSpecs() {
  const findings = [];

  for (const file of walkFiles(
    srcRoot,
    (name) => name.endsWith('.component.ts') && !name.endsWith('.spec.ts'),
  )) {
    const rel = toRel(file);
    const spec = file.replace(/\.ts$/, '.spec.ts');
    if (existsSync(spec) && /\bTestBed\b/.test(readText(spec))) continue;

    findings.push({
      rule: 'R-CP-1',
      file: rel,
      line: 0,
      detail: 'componente sin spec hermano ejecutable con TestBed',
      key: `${rel}|R-CP-1|spec`,
    });
  }

  return findings;
}

/** R-C-8 — cada adapter de aplicación que cruza el gateway tiene contrato. */
export function findMissingContractSpecs() {
  const findings = [];

  for (const file of walkFiles(
    srcRoot,
    (name) => name.endsWith('.adapter.ts') && !name.endsWith('.spec.ts'),
  )) {
    const rel = toRel(file);
    if (!rel.includes('/features/applications/') || LOCAL_ONLY_ADAPTERS.has(rel)) continue;
    if (existsSync(file.replace(/\.adapter\.ts$/, '.contract.spec.ts'))) continue;

    findings.push({
      rule: 'R-C-8',
      file: rel,
      line: 0,
      detail: 'adapter de backend sin fixture y spec de contrato versionados',
      key: `${rel}|R-C-8|contract-spec`,
    });
  }

  return findings;
}
