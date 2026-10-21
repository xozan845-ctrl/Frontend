import { defineSuite } from '../../engine/suite.mjs';
import { findStoreViolations } from './store-checks.mjs';
import { assertNoFresh } from '../architecture/assertions.mjs';

/**
 * R-ST-1/2/4/7 — guardas de estado con NgRx Signal Store.
 */
export default defineSuite({
  id: 'store-guards',
  area: 'frontend',
  rules: ['R-ST-1', 'R-ST-2', 'R-ST-4', 'R-ST-7'],
  cites: ['R-AR-5'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-ST-1/2/4/7: stores con signalStore, withMethods, patchState y withHooks', () => {
      assertNoFresh({
        assert,
        suiteId: 'store-guards',
        findings: findStoreViolations(),
        message:
          'Hay hallazgos de estado (R-ST-1/2/4/7). Usa signalStore + withMethods, muta con patchState, ' +
          'persiste en withHooks y evita BehaviorSubject:',
      });
    });
  },
});
