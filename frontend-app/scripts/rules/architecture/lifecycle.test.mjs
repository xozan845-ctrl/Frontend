import { defineSuite } from '../../engine/suite.mjs';
import { findLifecycleViolations } from './checks.mjs';
import { assertNoFresh } from './assertions.mjs';

/**
 * R-AR-15 — Componentes y directivas sin constructor ni hooks de ciclo de vida.
 *
 * La inyección se hace con `inject()`; la inicialización en field initializers
 * o `effect()`; la limpieza con `DestroyRef.onDestroy()`/`takeUntilDestroyed()`.
 * Las excepciones justificadas se aceptan en el baseline.
 */
export default defineSuite({
  id: 'architecture-lifecycle',
  area: 'architecture',
  rules: ['R-AR-15'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-AR-15: componentes/directivas usan inject, field initializers y DestroyRef', () => {
      assertNoFresh({
        assert,
        suiteId: 'architecture-lifecycle',
        findings: findLifecycleViolations(),
        message:
          'Hay componentes/directivas con constructor o hooks de ciclo de vida. ' +
          'Usa inject(), field initializers/effect() y DestroyRef.onDestroy()/takeUntilDestroyed() (R-AR-15):',
      });
    });
  },
});
