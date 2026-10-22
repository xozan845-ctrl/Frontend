import { defineSuite } from '../../engine/suite.mjs';
import { findPortsViolations } from './ports.mjs';
import { assertNoFresh } from './assertions.mjs';

/**
 * R-AR-3 — puertos + DI: repositorios con interfaz y token; stores sin adapters.
 */
export default defineSuite({
  id: 'architecture-ports',
  area: 'architecture',
  rules: ['R-AR-3'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-AR-3: repositorios con interfaz/InjectionToken y stores desacoplados', () => {
      assertNoFresh({
        assert,
        suiteId: 'architecture-ports',
        findings: findPortsViolations(),
        message:
          'Hay hallazgos de puertos/DI (R-AR-3). Declara interfaz + InjectionToken en repositories/ y haz que los stores dependan del puerto, no de adapters ni HttpClient:',
      });
    });
  },
});
