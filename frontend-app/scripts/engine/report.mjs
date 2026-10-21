/**
 * Salida del motor: plan de suites y reporte de cobertura de reglas. La
 * cobertura hace visible la deuda: qué IDs tienen check ejecutable y qué IDs
 * citan las suites sin estar definidos en `docs/rules` (hallazgo).
 */
import { relative } from 'node:path';
import { appRoot } from './lib/paths.mjs';
import { collectRuleIds } from './lib/rules-docs.mjs';
import { analyzeRuleCoverage } from './lib/coverage.mjs';

export function printSuitePlan(suites) {
  console.log(`Ejecutando validación modular de reglas (${suites.length} suites)...\n`);
  for (const suite of suites) {
    const rules = suite.rules.length > 0 ? suite.rules.join(', ') : '—';
    console.log(`  • ${suite.id}  [${suite.mode}]  ${rules}  — ${relative(appRoot, suite.file)}`);
  }
  console.log('');
}

export function printCoverage({ suites, rulesRoot, minVerified = 0 }) {
  const defined = collectRuleIds(rulesRoot);
  const analysis = analyzeRuleCoverage({ suites, definedIds: defined, minVerified });

  console.log('');
  console.log(
    `Cobertura verificada: ${analysis.verified.length}/${analysis.defined} IDs de regla tienen check.`,
  );
  if (analysis.contextual.length > 0) {
    console.log(
      `  Contextuales (cites sin check propio): ${analysis.contextual.length} — ${analysis.contextual.join(', ')}`,
    );
  }
  if (analysis.unknown.length > 0) {
    const ids = [...new Set(analysis.unknown.map((entry) => entry.id))].sort();
    console.log(
      `  ⚠ Hallazgo — IDs citados por suites sin definición en docs/rules: ${ids.join(', ')}`,
    );
  }
}
