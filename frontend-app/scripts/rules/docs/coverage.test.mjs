import { defineSuite } from '../../engine/suite.mjs';
import { collectSuiteMetadata, analyzeRuleCoverage } from '../../engine/lib/coverage.mjs';
import { collectRuleIds } from '../../engine/lib/rules-docs.mjs';
import { rulesDir, resolveInApp } from '../../engine/lib/paths.mjs';
import { COVERAGE_MIN_VERIFIED, RULES_DIR } from '../../config/project.mjs';

/**
 * R-DO-9 — Cobertura ejecutable honesta.
 *
 * Las suites declaran en `rules` solo lo que verifican; lo contextual va en
 * `cites`. La cobertura verificada no puede bajar del suelo configurado.
 */
export default defineSuite({
  id: 'governance-coverage',
  area: 'documentation',
  rules: ['R-DO-9'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-DO-9: las suites solo declaran lo que verifican y la cobertura no baja', () => {
      const analysis = analyzeRuleCoverage({
        suites: collectSuiteMetadata(rulesDir),
        definedIds: collectRuleIds(resolveInApp(RULES_DIR)),
        minVerified: COVERAGE_MIN_VERIFIED,
      });

      assert.deepEqual(
        analysis.unknown,
        [],
        `IDs citados sin definición en docs/rules (R-DO-9): ${JSON.stringify(analysis.unknown)}`,
      );
      assert.deepEqual(
        analysis.duplicates,
        [],
        `IDs declarados como rules y cites a la vez (R-DO-9): ${JSON.stringify(analysis.duplicates)}`,
      );
      assert.ok(
        !analysis.belowFloor,
        `Cobertura verificada ${analysis.verified.length}/${analysis.defined} por debajo del suelo ${analysis.minVerified} (R-DO-9).`,
      );
    });
  },
});
