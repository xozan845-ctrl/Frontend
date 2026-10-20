import { defineSuite } from '../../engine/suite.mjs';
import { findPackagingViolations } from './checks.mjs';
import { assertNoFresh } from './assertions.mjs';

/**
 * R-AR-14 — Empaquetado por unidad lógica.
 *
 * En las carpetas de capa (`state/`, `services/`, `repositories/`, `adapters/`,
 * `guards/`, `interceptors/`, `resolvers/`), una unidad lógica con ≥ 2 archivos
 * (implementación + tipos + spec) vive en su propia subcarpeta `<unidad>/`.
 * Evita carpetas planas del tipo `state/ai-jobs.store.ts` +
 * `state/ai-session.store.ts` + … (N lógicas × M archivos).
 */
export default defineSuite({
  id: 'architecture-packaging',
  area: 'architecture',
  rules: ['R-AR-14'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-AR-14: cada unidad lógica con ≥ 2 archivos vive en su subcarpeta', () => {
      assertNoFresh({
        assert,
        suiteId: 'architecture-packaging',
        findings: findPackagingViolations(),
        message:
          'Hay unidades lógicas con varios archivos en plano. Agrupa cada una en <capa>/<unidad>/ (R-AR-14):',
      });
    });
  },
});
