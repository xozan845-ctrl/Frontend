import { defineSuite } from '../../engine/suite.mjs';
import { findFeatureStructureViolations } from './feature-checks.mjs';
import { formatFindings } from './assertions.mjs';

/**
 * R-AR-16 — Contrato estructural de feature.
 *
 * Comprueba capas obligatorias/declaradas, archivos raíz permitidos, rutas
 * lazy, API pública y la forma de las unidades de `pages/` y `components/`.
 */
export default defineSuite({
  id: 'architecture-features',
  area: 'architecture',
  rules: ['R-AR-16'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-AR-16: cada feature cumple su contrato estructural', () => {
      const findings = findFeatureStructureViolations();

      assert.deepEqual(
        findings.map((finding) => finding.key),
        [],
        'Hay features que no cumplen su contrato estructural (R-AR-16):\n' +
          formatFindings(findings),
      );
    });
  },
});
