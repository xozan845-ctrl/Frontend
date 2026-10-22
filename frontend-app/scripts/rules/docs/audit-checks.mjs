/**
 * Frescura de `AUDIT.md` (R-COV-3): el snapshot debe existir, llevar fecha de
 * última auditoría y citar la versión vigente de la app (`package.json`).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolveInApp } from '../../engine/lib/paths.mjs';

const AUDIT = resolveInApp('docs/rules/_meta/AUDIT.md');
const PKG = resolveInApp('package.json');
const REL = 'docs/rules/_meta/AUDIT.md';

/** Hallazgos de R-COV-3. */
export function findAuditViolations() {
  const findings = [];
  const add = (detail, suffix) =>
    findings.push({ rule: 'R-COV-3', file: REL, line: 0, detail, key: `${REL}|R-COV-3|${suffix}` });

  if (!existsSync(AUDIT)) {
    add('falta el snapshot AUDIT.md', 'missing');
    return findings;
  }

  const text = readFileSync(AUDIT, 'utf8');
  const version = JSON.parse(readFileSync(PKG, 'utf8')).version;

  if (!/Última auditoría:\*\*\s+\d{4}-\d{2}-\d{2}/.test(text)) {
    add('falta la fecha de la última auditoría', 'date');
  }

  if (!text.includes(version)) {
    add(`AUDIT.md no cita la versión vigente (${version})`, 'version');
  }

  return findings;
}
