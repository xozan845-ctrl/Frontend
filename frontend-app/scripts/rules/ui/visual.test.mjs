import { defineSuite } from '../../engine/suite.mjs';
import { GLASS_MIN_COVERAGE } from '../../config/project.mjs';
import { findGlassSystemViolations, getGlassCoverage } from './visual-checks.mjs';
import { assertNoFresh } from '../architecture/assertions.mjs';

/**
 * R-UX-7 — el sistema visual Glass es único, centralizado y verificable.
 */
export default defineSuite({
  id: 'visual-guards',
  area: 'ui',
  rules: ['R-UX-7'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-UX-7: cobertura de requisitos Glass >= mínimo configurado', () => {
      const coverage = getGlassCoverage(findGlassSystemViolations());

      console.log(
        `  ℹ Cobertura real de requisitos Glass: ${coverage.implemented}/${coverage.total} ` +
          `(${coverage.percent.toFixed(1)}%), mínimo ${GLASS_MIN_COVERAGE}%.`,
      );
      if (coverage.pending.length > 0) {
        console.log(`  ℹ Requisitos incumplidos: ${coverage.pending.join(', ')}.`);
      }

      assert.ok(
        coverage.percent >= GLASS_MIN_COVERAGE,
        `Cobertura real de requisitos Glass ${coverage.percent.toFixed(1)}% por debajo del mínimo ` +
          `${GLASS_MIN_COVERAGE}% (${coverage.implemented}/${coverage.total}).`,
      );
    });

    test('R-UX-7: tokens, utilidades, primitivos, plantillas y fallback cumplen Glass', () => {
      assertNoFresh({
        assert,
        suiteId: 'visual-guards',
        findings: findGlassSystemViolations(),
        message:
          'Hay hallazgos del sistema visual Glass (R-UX-7). ' +
          'Define tokens/utilidades/primitivos en src/styles.css y reutilízalos:',
      });
    });
  },
});
