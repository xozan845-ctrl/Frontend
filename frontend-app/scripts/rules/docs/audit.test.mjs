import { defineSuite } from '../../engine/suite.mjs';
import { findAuditViolations } from './audit-checks.mjs';
import { assertNoFresh } from '../architecture/assertions.mjs';

/**
 * R-COV-3 — el snapshot `AUDIT.md` se mantiene fresco (fecha + versión vigente).
 */
export default defineSuite({
  id: 'audit-freshness',
  area: 'docs',
  rules: ['R-COV-3'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-COV-3: AUDIT.md cita la fecha de auditoría y la versión vigente', () => {
      assertNoFresh({
        assert,
        suiteId: 'audit-freshness',
        findings: findAuditViolations(),
        message:
          'El snapshot AUDIT.md está desactualizado (R-COV-3). Actualiza fecha y cifras, y cita la versión de package.json:',
      });
    });
  },
});
