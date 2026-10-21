import { defineSuite } from '../../engine/suite.mjs';
import { findTypeDeclarations } from './checks.mjs';
import { findDtoViolations } from './naming-checks.mjs';
import { assertNoFresh } from './assertions.mjs';

/**
 * R-NC-13 — Declaraciones de tipo en archivos dedicados.
 * R-NC-9  — DTOs de backend (`Backend...DTO`) separados del modelo de dominio.
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
  rules: ['R-NC-13', 'R-NC-9'],
  cites: ['R-CX-4'],
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

    test('R-NC-9: los DTOs de backend se llaman Backend...DTO y no entran al dominio', () => {
      assertNoFresh({
        assert,
        suiteId: 'architecture-types',
        findings: findDtoViolations(),
        message:
          'Hay hallazgos de DTO vs modelo (R-NC-9). Usa models/*.dto.ts con Backend...DTO y no importes DTOs desde el modelo:',
      });
    });
  },
});
