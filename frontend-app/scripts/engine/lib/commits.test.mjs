import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBranchName, validateCommitSubject } from './commits.mjs';

const allowed = {
  types: ['feat', 'fix', 'docs', 'test', 'refactor', 'perf', 'style', 'ci', 'build', 'chore'],
  scopes: ['cart', 'auth', 'rules', 'ci', 'architecture', 'git'],
};

test('validateCommitSubject acepta asuntos conformes', () => {
  for (const subject of [
    'feat(cart): validar cupón de descuento (R-U-9)',
    'fix(auth): refrescar el token ante un 401',
    'refactor(architecture): agrupar state por unidad (R-AR-14)',
    'docs(rules): documentar las suites de git (R-DO-1)',
    'ci(rules): ejecutar el motor de gobernanza',
  ]) {
    assert.deepEqual(validateCommitSubject(subject, allowed), [], subject);
  }
});

test('validateCommitSubject rechaza formato, tipo y ámbito inválidos', () => {
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

test('validateCommitSubject rechaza gerundio, pasado y resumen genérico', () => {
  assert.match(validateCommitSubject('feat(cart): agregando cupón', allowed).join(' '), /gerundio/);
  assert.match(validateCommitSubject('fix(auth): corregí el 401', allowed).join(' '), /pasado/);
  assert.match(validateCommitSubject('feat(cart): wip', allowed).join(' '), /genérico/);
});

test('validateBranchName acepta ramas cortas del flujo', () => {
  for (const branch of [
    'feat/firebase-hosting-staging',
    'refactor/packaging-seo',
    'chore/release-1.21.0',
    'feat/rules-ar-15',
  ]) {
    assert.deepEqual(validateBranchName(branch, allowed), [], branch);
  }
  assert.deepEqual(validateBranchName('main', allowed), []);
});

test('validateBranchName rechaza tipos y formatos inválidos', () => {
  assert.match(validateBranchName('feat', allowed).join(' '), /patrón/);
  assert.match(
    validateBranchName('feature/foo', allowed).join(' '),
    /tipo de rama 'feature' no admitido/,
  );
  assert.match(validateBranchName('feat/foo', allowed).join(' '), /rama debe incluir/);
  assert.match(validateBranchName('develop', allowed).join(' '), /patrón/);
});
