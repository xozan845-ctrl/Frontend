import { defineSuite } from '../../engine/suite.mjs';
import {
  findPageDerivationViolations,
  findPresentationalStoreViolations,
} from './presentation-checks.mjs';
import { assertNoFresh } from '../architecture/assertions.mjs';

/**
 * R-SO-8 + R-ST-3 — guardas de presentación.
 *
 * Los presentacionales no conocen stores y las páginas no derivan estado de
 * dominio: los derivados viven en `withComputed` del store.
 */
export default defineSuite({
  id: 'presentation-guards',
  area: 'frontend',
  rules: ['R-SO-8', 'R-ST-3'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-SO-8: los componentes presentacionales no inyectan stores', () => {
      assertNoFresh({
        assert,
        suiteId: 'presentation-guards',
        findings: findPresentationalStoreViolations(),
        message:
          'Hay componentes presentacionales acoplados a estado (R-SO-8). ' +
          'Reciben datos por input y emiten output; los stores viven en páginas/contenedores:',
      });
    });

    test('R-ST-3: las páginas no derivan estado de dominio (vive en withComputed)', () => {
      assertNoFresh({
        assert,
        suiteId: 'presentation-guards',
        findings: findPageDerivationViolations(),
        message:
          'Hay derivados de dominio calculados en páginas (R-ST-3). ' +
          'Muévelos a withComputed del store para que la página solo muestre estado:',
      });
    });
  },
});
