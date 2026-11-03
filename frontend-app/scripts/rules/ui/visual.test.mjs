import { defineSuite } from '../../engine/suite.mjs';
import { findGlassSystemViolations } from './visual-checks.mjs';
import { assertNoFresh } from '../architecture/assertions.mjs';

/**
 * R-UX-7 — el sistema visual Glass es único y centralizado.
 */
export default defineSuite({
  id: 'visual-guards',
  area: 'ui',
  rules: ['R-UX-7'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-UX-7: tokens, utilidades y primitivos Glass viven solo en src/styles.css', () => {
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
