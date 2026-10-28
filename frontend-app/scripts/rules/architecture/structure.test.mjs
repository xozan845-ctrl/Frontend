import { defineSuite } from '../../engine/suite.mjs';
import { assertNoFresh } from './assertions.mjs';
import {
  findApplicationStructureViolations,
  findContractPathViolations,
  findPublicSurfaceViolations,
  findRouteArchitectureViolations,
  findScriptsArchitectureViolations,
} from './structure-checks.mjs';

/**
 * R-AR-17/18/19 — Fronteras estructurales de la aplicación y del motor.
 *
 * Estas guardas cubren los huecos que no puede detectar el chequeo de capas:
 * árbol global, contratos declarados, superficies públicas, rutas y el propio
 * sistema de reglas.
 */
export default defineSuite({
  id: 'architecture-structure',
  area: 'architecture',
  rules: ['R-AR-17', 'R-AR-18', 'R-AR-19'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-AR-17: app y contratos respetan sus fronteras estructurales', () => {
      assertNoFresh({
        assert,
        suiteId: 'architecture-structure',
        findings: [...findApplicationStructureViolations(), ...findContractPathViolations()],
        message:
          'La estructura global de src/app o los contratos declarados no coinciden con el proyecto (R-AR-17):',
      });
    });

    test('R-AR-18: superficies públicas y rutas conservan sus fronteras', () => {
      assertNoFresh({
        assert,
        suiteId: 'architecture-structure',
        findings: [...findPublicSurfaceViolations(), ...findRouteArchitectureViolations()],
        message:
          'Hay una superficie pública o ruta que rompe el contrato de composición (R-AR-18):',
      });
    });

    test('R-AR-19: scripts conserva las capas del motor de gobernanza', () => {
      assertNoFresh({
        assert,
        suiteId: 'architecture-structure',
        findings: findScriptsArchitectureViolations(),
        message: 'El motor de reglas tiene una estructura o dependencia inválida (R-AR-19):',
      });
    });
  },
});
