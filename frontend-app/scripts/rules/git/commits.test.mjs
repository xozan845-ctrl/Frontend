import { defineSuite } from '../../engine/suite.mjs';
import { validateBranchName, validateCommitSubject } from '../../engine/lib/commits.mjs';
import { ALLOWED_COMMIT_SCOPES, ALLOWED_COMMIT_TYPES } from '../../config/project.mjs';

/**
 * R-GC-1..4 (parte pura) y R-GB-2: el validador de asuntos y ramas se prueba
 * con datos sintéticos, sin tocar git. La parte contextual (commits y rama
 * reales del PR) vive en `branch.test.mjs`, en modo `repo`.
 */

const allowed = {
  types: ALLOWED_COMMIT_TYPES,
  scopes: ALLOWED_COMMIT_SCOPES,
};

export default defineSuite({
  id: 'git-commits',
  area: 'git',
  rules: ['R-GC-1', 'R-GC-2', 'R-GC-3', 'R-GC-4', 'R-GB-2'],
  mode: 'pure',
  run: ({ test, assert }) => {
    test('R-GC-1/2: acepta asuntos conformes', () => {
      for (const subject of [
        'feat(cart): validar cupón de descuento (R-U-9)',
        'fix(auth): refrescar el token ante un 401',
        'refactor(architecture): agrupar state por unidad (R-AR-14)',
        'docs(rules): documentar las suites de git (R-DO-1)',
        'ci(rules): ejecutar el motor de gobernanza',
        'build(deps): actualizar Angular CLI (R-SE-5)',
      ]) {
        assert.deepEqual(
          validateCommitSubject(subject, allowed),
          [],
          `debería aceptar: ${subject}`,
        );
      }
    });

    test('R-GC-1/2: rechaza formato, tipo y ámbito inválidos', () => {
      assert.match(validateCommitSubject('wip', allowed)[0], /formato/);
      assert.match(validateCommitSubject('feat: sin ámbito', allowed).join(' '), /falta el ámbito/);
      assert.match(
        validateCommitSubject('feat(zzz): algo', allowed).join(' '),
        /ámbito 'zzz' no reconocido/,
      );
      assert.match(
        validateCommitSubject('audit(plans): revisar accesibilidad', allowed).join(' '),
        /tipo 'audit' no admitido/,
      );
    });

    test('R-GC-1/2: rechaza gerundio, pasado y resumen genérico', () => {
      assert.match(
        validateCommitSubject('feat(cart): agregando cupón', allowed).join(' '),
        /gerundio/,
      );
      assert.match(validateCommitSubject('fix(auth): corregí el 401', allowed).join(' '), /pasado/);
      assert.match(validateCommitSubject('feat(cart): wip', allowed).join(' '), /genérico/);
    });

    test('R-GB-2: acepta ramas cortas del flujo', () => {
      for (const branch of [
        'feat/firebase-hosting-staging',
        'refactor/packaging-seo',
        'chore/release-1.21.0',
        'feat/rules-ar-15',
      ]) {
        assert.deepEqual(validateBranchName(branch, allowed), [], `debería aceptar: ${branch}`);
      }
      assert.deepEqual(validateBranchName('main', allowed), []);
    });

    test('R-GB-2: rechaza tipos y formatos inválidos', () => {
      assert.match(validateBranchName('feat', allowed).join(' '), /patrón/);
      assert.match(
        validateBranchName('feature/foo', allowed).join(' '),
        /tipo de rama 'feature' no admitido/,
      );
      assert.match(validateBranchName('feat/foo', allowed).join(' '), /rama debe incluir/);
      assert.match(validateBranchName('develop', allowed).join(' '), /patrón/);
    });
  },
});
