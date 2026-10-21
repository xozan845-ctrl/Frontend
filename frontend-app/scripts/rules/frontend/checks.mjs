/**
 * Guardas estáticas de rendimiento (R-PF-6/7): sin sondeo con `setInterval`/
 * `setTimeout` en features y sin `zone.js`.
 */
import { relative, sep } from 'node:path';
import { appRoot, resolveInApp } from '../../engine/lib/paths.mjs';
import { readText, walkFiles } from '../../engine/lib/fs.mjs';
import { lineAt, maskSource } from '../../engine/lib/source.mjs';

const featuresRoot = resolveInApp('src/app/features');
const toRel = (path) => relative(appRoot, path).split(sep).join('/');

/** Hallazgos de R-PF-6/7. */
export function findPerformanceViolations() {
  const findings = [];

  for (const file of walkFiles(
    featuresRoot,
    (name) => name.endsWith('.ts') && !name.endsWith('.spec.ts'),
  )) {
    const rel = toRel(file);
    const masked = maskSource(readText(file));
    for (const match of masked.matchAll(/set(?:Interval|Timeout)\s*\(/g)) {
      findings.push({
        rule: 'R-PF-6',
        file: rel,
        line: lineAt(masked, match.index),
        detail: 'setInterval/setTimeout en feature (R-PF-6)',
        key: `${rel}|R-PF-6|${match[0]}`,
      });
    }
  }

  const packageJson = readText(resolveInApp('package.json'));
  const angularJson = readText(resolveInApp('angular.json'));
  if (/zone\.js/.test(packageJson) || /zone\.js/.test(angularJson)) {
    findings.push({
      rule: 'R-PF-7',
      file: 'package.json',
      line: 0,
      detail: 'zone.js presente en dependencias/configuración (R-PF-7)',
      key: 'package.json|R-PF-7|zone.js',
    });
  }

  return findings;
}
