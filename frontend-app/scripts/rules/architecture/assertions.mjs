/**
 * Utilidades de aserción compartidas por las suites de arquitectura.
 */
import { baselineFor } from '../../config/baseline.mjs';

/**
 * Separa hallazgos en deuda aceptada (baseline) y hallazgos nuevos.
 * @param {string} suiteId
 * @param {Array<{ key: string }>} findings
 */
export function partitionByBaseline(suiteId, findings) {
  const accepted = baselineFor(suiteId);
  return {
    baselined: findings.filter((finding) => accepted.has(finding.key)),
    fresh: findings.filter((finding) => !accepted.has(finding.key)),
  };
}

/** Formatea hallazgos para el mensaje de error de `node:test`. */
export function formatFindings(findings) {
  return findings
    .map((finding) => `  - ${finding.file}:${finding.line} ${finding.rule} — ${finding.detail}`)
    .join('\n');
}

/** Mensaje estándar: falla si hay hallazgos nuevos; informa la deuda aceptada. */
export function assertNoFresh({ assert, suiteId, findings, message }) {
  const { baselined, fresh } = partitionByBaseline(suiteId, findings);

  if (baselined.length > 0) {
    console.log(`  ℹ ${baselined.length} hallazgo(s) en baseline (deuda aceptada).`);
  }

  assert.deepEqual(
    fresh.map((finding) => finding.key),
    [],
    `${message}\n${formatFindings(fresh)}`,
  );
}
