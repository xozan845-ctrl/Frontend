import { defineSuite } from '../../engine/suite.mjs';
import { findProhibitedApiViolations } from './checks.mjs';
import { assertNoFresh } from './assertions.mjs';

/**
 * R-AR-7/9/10 — guardas de APIs prohibidas y ciclo de vida.
 */
export default defineSuite({
  id: 'architecture-guards',
  area: 'architecture',
  rules: ['R-AR-7', 'R-AR-9', 'R-AR-10'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-AR-7/9/10: sin ngModel, diálogos nativos ni subscribe sin limpieza', () => {
      assertNoFresh({
        assert,
        suiteId: 'architecture-guards',
        findings: findProhibitedApiViolations(),
        message:
          'Hay hallazgos de APIs prohibidas/ciclo de vida (R-AR-7/9/10). ' +
          'Usa ReactiveFormsModule, NotificationService y takeUntilDestroyed:',
      });
    });
  },
});
