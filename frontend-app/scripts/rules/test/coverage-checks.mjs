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
import { walkFiles } from '../../engine/lib/fs.mjs';

const srcRoot = resolveInApp('src/app');
const toRel = (path) => relative(appRoot, path).split(sep).join('/');

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
