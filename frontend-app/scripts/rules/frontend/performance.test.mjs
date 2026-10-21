import { defineSuite } from '../../engine/suite.mjs';
import { findPerformanceViolations } from './checks.mjs';
import { assertNoFresh } from '../architecture/assertions.mjs';

/**
 * R-PF-6/7 — guardas estáticas de rendimiento.
 */
export default defineSuite({
  id: 'performance-guards',
  area: 'frontend',
  rules: ['R-PF-6', 'R-PF-7'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-PF-6/7: sin setInterval/setTimeout en features ni zone.js', () => {
      assertNoFresh({
        assert,
        suiteId: 'performance-guards',
        findings: findPerformanceViolations(),
        message:
          'Hay hallazgos de rendimiento estático (R-PF-6/7). ' +
          'Evita sondeo con setInterval/setTimeout en features y no añadas zone.js:',
      });
    });
  },
});
