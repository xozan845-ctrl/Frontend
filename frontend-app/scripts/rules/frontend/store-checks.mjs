/**
 * Guardas de estado (R-ST-1/2/4/7): los `*.store.ts` usan `signalStore` con
 * `withMethods`, mutan con `patchState`, persisten en `withHooks` y no usan
 * `BehaviorSubject`.
 */
import { relative, sep } from 'node:path';
import { appRoot, resolveInApp } from '../../engine/lib/paths.mjs';
import { readText, walkFiles } from '../../engine/lib/fs.mjs';
import { lineAt, maskSource } from '../../engine/lib/source.mjs';

const srcRoot = resolveInApp('src/app');
const toRel = (path) => relative(appRoot, path).split(sep).join('/');

const isSpec = (rel) => rel.endsWith('.spec.ts');

/** Hallazgos de R-ST-1/2/4/7. */
export function findStoreViolations() {
  const findings = [];
  const add = (rule, rel, line, detail, suffix) => {
    findings.push({ rule, file: rel, line, detail, key: `${rel}|${rule}|${suffix}` });
  };

  for (const file of walkFiles(srcRoot, (name) => name.endsWith('.ts'))) {
    const rel = toRel(file);
    if (isSpec(rel)) continue;
    const masked = maskSource(readText(file));

    if (/\bBehaviorSubject\b/.test(masked)) {
      add(
        'R-ST-1',
        rel,
        lineAt(masked, masked.indexOf('BehaviorSubject')),
        'BehaviorSubject en estado',
        'BehaviorSubject',
      );
    }

    if (!rel.endsWith('.store.ts')) continue;

    if (!/\bsignalStore\s*\(/.test(masked)) {
      add('R-ST-2', rel, 0, 'el store no usa signalStore', 'signalStore');
    }
    if (!/\bwithMethods\s*\(/.test(masked)) {
      add('R-ST-2', rel, 0, 'el store no declara withMethods', 'withMethods');
    }
    if (/\bwithState\s*\(/.test(masked) && !/\bpatchState\s*\(/.test(masked)) {
      add('R-ST-4', rel, 0, 'withState sin mutaciones con patchState', 'patchState');
    }
    if (/\blocalStorage\b/.test(masked) && !/\bwithHooks\s*\(/.test(masked)) {
      add('R-ST-7', rel, 0, 'persistencia en localStorage fuera de withHooks', 'withHooks');
    }
  }

  return findings;
}
