import { defineSuite } from '../../engine/suite.mjs';
import { findHardcodedConfig } from './checks.mjs';
import { assertNoFresh } from './assertions.mjs';

/**
 * R-AR-11 — Configuración por entorno.
 *
 * Hosts y rutas de API viven en `environments/` o constantes; prohibido
 * hardcodear URLs en services, stores, páginas o componentes, y prohibido leer
 * `environment.apiUrl` desde la presentación.
 */
export default defineSuite({
  id: 'architecture-config',
  area: 'architecture',
  rules: ['R-AR-11'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-AR-11: sin URLs de API hardcodeadas en la capa de aplicación/presentación', () => {
      assertNoFresh({
        assert,
        suiteId: 'architecture-config',
        findings: findHardcodedConfig(),
        message:
          'Hay URLs hardcodeadas fuera de environments/constantes. ' +
          'Usa environment.apiUrl / DEFAULT_API_CONFIG o una constante del feature:',
      });
    });
  },
});
