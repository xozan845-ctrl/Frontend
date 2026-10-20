import { defineSuite } from '../../engine/suite.mjs';
import { findTypeDeclarations } from './checks.mjs';
import { assertNoFresh } from './assertions.mjs';

/**
 * R-NC-13 — Declaraciones de tipo en archivos dedicados.
 *
 * `interface`, `type X =` y `enum` deben vivir en `models/`, `*.model.ts`,
 * `*.dto.ts`, `*.types.ts`, `*.state.ts`, `*.repository.ts` (puertos) o en un
 * archivo que sólo contenga tipos. Prohibido declararlos dentro de services,
 * stores, adapters, páginas, componentes o constantes/config.
 *
 * Excepción: tipos derivados de una constante (`type X = (typeof C)[number]`).
 */
export default defineSuite({
  id: 'architecture-types',
  area: 'architecture',
  rules: ['R-NC-13', 'R-NC-9', 'R-CX-4'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-NC-13: los tipos se declaran en archivos dedicados, no mezclados con implementación', () => {
      assertNoFresh({
        assert,
        suiteId: 'architecture-types',
        findings: findTypeDeclarations(),
        message:
          'Hay declaraciones de tipo fuera de archivos dedicados (R-NC-13). ' +
          'Muévelas a models/*.model.ts, *.dto.ts, *.types.ts, *.state.ts o un archivo de sólo tipos:',
      });
    });
  },
});
