/**
 * Guardas de puertos e inyección (R-AR-3).
 *
 * - Todo `*.repository.ts` declara el puerto (`interface`) y su `InjectionToken`.
 * - Los stores dependen del puerto, no de un adapter concreto ni de `HttpClient`.
 */
import { relative, sep } from 'node:path';
import { appRoot, resolveInApp } from '../../engine/lib/paths.mjs';
import { readText, walkFiles } from '../../engine/lib/fs.mjs';
import { lineAt, maskSource } from '../../engine/lib/source.mjs';

const srcRoot = resolveInApp('src/app');
const toRel = (path) => relative(appRoot, path).split(sep).join('/');

const finding = (file, line, detail, suffix) => ({
  rule: 'R-AR-3',
  file,
  line,
  detail,
  key: `${file}|R-AR-3|${suffix}`,
});

/** Hallazgos de R-AR-3. */
export function findPortsViolations() {
  const findings = [];

  for (const file of walkFiles(
    srcRoot,
    (name) => name.endsWith('.ts') && !name.endsWith('.spec.ts'),
  )) {
    const rel = toRel(file);
    const masked = maskSource(readText(file));

    if (rel.includes('/repositories/') && rel.endsWith('.repository.ts')) {
      if (!/new\s+InjectionToken\b/.test(masked)) {
        findings.push(finding(rel, 0, 'el repositorio no exporta un InjectionToken', 'token'));
      }
      if (!/export\s+interface\s+\w+/.test(masked)) {
        findings.push(finding(rel, 0, 'el repositorio no declara el puerto (interface)', 'port'));
      }
    }

    if (rel.endsWith('.store.ts')) {
      const adapter = masked.match(/from\s*'[^']*\/adapters\//);
      if (adapter) {
        findings.push(
          finding(
            rel,
            lineAt(masked, adapter.index),
            'el store importa un adapter en vez del puerto',
            'adapter',
          ),
        );
      }
      const http = masked.match(/from\s*'@angular\/common\/http'/);
      if (http) {
        findings.push(
          finding(
            rel,
            lineAt(masked, http.index),
            'el store usa HttpClient en vez de un repositorio',
            'http',
          ),
        );
      }
    }
  }

  return findings;
}
