import { defineSuite } from '../../engine/suite.mjs';
import {
  findMissingComponentSpecs,
  findMissingContractSpecs,
  findMissingSpecs,
} from './coverage-checks.mjs';
import { assertNoFresh } from '../architecture/assertions.mjs';

/**
 * R-COV-2 — specs hermanos para archivos de lógica.
 */
export default defineSuite({
  id: 'coverage-guards',
  area: 'test',
  rules: ['R-COV-2', 'R-CP-1', 'R-C-8'],
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

    test('R-CP-1: todos los componentes tienen spec hermano con TestBed', () => {
      assertNoFresh({
        assert,
        suiteId: 'coverage-guards',
        findings: findMissingComponentSpecs(),
        message:
          'Hay componentes con lógica sin spec hermano (R-CP-1). Añade el TestBed y prueba ' +
          'la interacción o el estado visible en el mismo PR:',
      });
    });

    test('R-C-8: cada adapter de backend tiene contrato versionado', () => {
      assertNoFresh({
        assert,
        suiteId: 'coverage-guards',
        findings: findMissingContractSpecs(),
        message: 'Hay adapters de aplicación sin fixture y spec de contrato versionados (R-C-8).',
      });
    });
  },
});
