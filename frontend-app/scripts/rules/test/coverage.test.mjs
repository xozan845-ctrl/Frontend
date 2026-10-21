import { defineSuite } from '../../engine/suite.mjs';
import { findMissingSpecs } from './coverage-checks.mjs';
import { assertNoFresh } from '../architecture/assertions.mjs';

/**
 * R-COV-2 — specs hermanos para archivos de lógica.
 */
export default defineSuite({
  id: 'coverage-guards',
  area: 'test',
  rules: ['R-COV-2'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-COV-2: services, adapters y stores tienen spec hermano', () => {
      assertNoFresh({
        assert,
        suiteId: 'coverage-guards',
        findings: findMissingSpecs(),
        message:
          'Hay archivos de lógica sin spec (R-COV-2). Añade el *.spec.ts hermano en el mismo PR:',
      });
    });
  },
});
