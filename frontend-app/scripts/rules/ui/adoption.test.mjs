import { defineSuite } from '../../engine/suite.mjs';
import { GLASS_ADOPTION_PENDING_MAX } from '../../config/project.mjs';
import { findGlassAdoptionViolations, getGlassAdoptionBacklog } from './adoption-checks.mjs';
import { assertNoFresh } from '../architecture/assertions.mjs';

/**
 * R-UX-8 — adopción del sistema Glass con ratchet por áreas.
 *
 * Las raíces ya adoptadas no pueden volver a superficies crudas y el backlog
 * pendiente solo puede bajar.
 */
export default defineSuite({
  id: 'visual-adoption-guards',
  area: 'ui',
  rules: ['R-UX-8'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-UX-8: las áreas adoptadas usan Glass y no regresan', () => {
      assertNoFresh({
        assert,
        suiteId: 'visual-adoption-guards',
        findings: findGlassAdoptionViolations(),
        message:
          'Hay superficies crudas en áreas ya adoptadas (R-UX-8). ' +
          'Usa .glass*, .card, .btn-*, .input, .badge-*, .alert-* o .icon-btn:',
      });
    });

    test('R-UX-8: el backlog de adopción no crece', () => {
      const backlog = getGlassAdoptionBacklog();

      console.log(
        `  ℹ Adopción Glass: ${backlog.adoptedRoots} raíces adoptadas; ` +
          `${backlog.pending} superficies pendientes en ${backlog.files} archivos ` +
          `(máximo ${GLASS_ADOPTION_PENDING_MAX}).`,
      );
      if (backlog.byArea.length > 0) {
        console.log(
          `  ℹ Backlog por área: ${backlog.byArea
            .slice(0, 8)
            .map(([area, count]) => `${area} (${count})`)
            .join(', ')}.`,
        );
      }

      assert.ok(
        backlog.pending <= GLASS_ADOPTION_PENDING_MAX,
        `El backlog de adopción Glass creció a ${backlog.pending} superficies ` +
          `(máximo ${GLASS_ADOPTION_PENDING_MAX}). Migra el área antes de añadir superficies crudas.`,
      );
    });
  },
});
