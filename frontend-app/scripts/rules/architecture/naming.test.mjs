import { defineSuite } from '../../engine/suite.mjs';
import { findNamingViolations } from './naming-checks.mjs';
import { assertNoFresh } from './assertions.mjs';

/**
 * R-NC-1/2/11 — nomenclatura de archivos, plantillas hermanas y claves `ecom_`.
 */
export default defineSuite({
  id: 'naming-guards',
  area: 'architecture',
  rules: ['R-NC-1', 'R-NC-2', 'R-NC-11'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-NC-1/2/11: sufijos por capa, plantillas hermanas y claves ecom_', () => {
      assertNoFresh({
        assert,
        suiteId: 'naming-guards',
        findings: findNamingViolations(),
        message:
          'Hay hallazgos de nomenclatura (R-NC-1/2/11). Revisa sufijos por capa, templateUrl/styleUrl y claves localStorage:',
      });
    });
  },
});
