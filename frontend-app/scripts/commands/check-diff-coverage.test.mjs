import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  canonicalCoveragePath,
  computeDiffCoverage,
  evaluateCoverage,
  gitDiff,
  isInstrumentedPath,
  parseLcov,
  parseUnifiedDiff,
} from './check-diff-coverage.mjs';
import { appRoot } from '../engine/lib/paths.mjs';

const ROOT = '/repo/frontend-app';
const LCOV = [
  'SF:/repo/frontend-app/src/app/a.service.ts',
  'DA:1,1',
  'DA:2,0',
  'DA:3,2',
  'end_of_record',
].join('\n');

const diffLine = (file) => [`diff --git a/${file} b/${file}`, `--- a/${file}`, `+++ b/${file}`];

test('parseLcov mapea archivos y hits', () => {
  const lcov = parseLcov(LCOV);

  assert.equal(lcov.get('/repo/frontend-app/src/app/a.service.ts').get(2), 0);
  assert.equal(lcov.get('/repo/frontend-app/src/app/a.service.ts').get(3), 2);
});

test('parseUnifiedDiff extrae las líneas nuevas de cada hunk', () => {
  const diff = [
    ...diffLine('src/app/a.service.ts'),
    '@@ -1,0 +1,2 @@',
    '+linea nueva',
    '+otra',
  ].join('\n');

  assert.deepEqual([...parseUnifiedDiff(diff).get('src/app/a.service.ts')], [1, 2]);
});

test('parseUnifiedDiff ignora archivos eliminados y hunks sin líneas nuevas', () => {
  const diff = [
    'diff --git a/src/app/viejo.ts b/src/app/viejo.ts',
    '--- a/src/app/viejo.ts',
    '+++ /dev/null',
    '@@ -1,2 +0,0 @@',
    '-viejo',
    '-viejo',
    ...diffLine('src/app/a.service.ts'),
    '@@ -1,0 +1,1 @@',
    '+nueva',
  ].join('\n');

  const changed = parseUnifiedDiff(diff);
  assert.equal(changed.has('src/app/viejo.ts'), false);
  assert.deepEqual([...changed.get('src/app/a.service.ts')], [1]);
});

test('parseUnifiedDiff no confunde una línea añadida +++ con una cabecera', () => {
  const diff = [
    ...diffLine('src/app/a.service.ts'),
    '@@ -1,0 +1,2 @@',
    '+++ b/contenido.ts',
    '+real',
  ].join('\n');

  assert.deepEqual([...parseUnifiedDiff(diff).get('src/app/a.service.ts')], [1, 2]);
});

test('canonicalCoveragePath unifica rutas relativas, prefijadas, Windows y absolutas', () => {
  assert.equal(canonicalCoveragePath('src/app/a.ts', { root: ROOT }), 'src/app/a.ts');
  assert.equal(canonicalCoveragePath('./src/app/a.ts', { root: ROOT }), 'src/app/a.ts');
  assert.equal(canonicalCoveragePath('frontend-app/src/app/a.ts', { root: ROOT }), 'src/app/a.ts');
  assert.equal(
    canonicalCoveragePath('frontend-app\\src\\app\\a.ts', { root: ROOT }),
    'src/app/a.ts',
  );
  assert.equal(
    canonicalCoveragePath('/repo/frontend-app/src/app/a.ts', { root: ROOT }),
    'src/app/a.ts',
  );
  assert.equal(
    canonicalCoveragePath('C:\\repo\\frontend-app\\src\\app\\a.ts', {
      root: 'C:\\repo\\frontend-app',
    }),
    'src/app/a.ts',
  );
});

test('isInstrumentedPath refleja coverageInclude y coverageExclude de angular.json', () => {
  assert.equal(
    isInstrumentedPath('src/app/features/domains/x/adapters/a.ts', { root: ROOT }),
    true,
  );
  assert.equal(isInstrumentedPath('frontend-app/src/app/core/services/a.ts', { root: ROOT }), true);
  assert.equal(
    isInstrumentedPath('src/app/features/domains/x/components/a.component.ts', { root: ROOT }),
    false,
  );
  assert.equal(isInstrumentedPath('src/app/features/domains/x/models/a.ts', { root: ROOT }), false);
  assert.equal(
    isInstrumentedPath('src/app/features/domains/x/adapters/a.spec.ts', { root: ROOT }),
    false,
  );
  assert.equal(
    isInstrumentedPath('src/app/features/domains/x/adapters/mocks/a.ts', { root: ROOT }),
    false,
  );
});

test('computeDiffCoverage cruza lcov relativo con diff prefijado por frontend-app', () => {
  const lcov = parseLcov(
    ['SF:src/app/a.service.ts', 'DA:1,1', 'DA:2,0', 'DA:3,2', 'end_of_record'].join('\n'),
  );
  const changed = new Map([['frontend-app/src/app/a.service.ts', new Set([1, 2])]]);
  const result = computeDiffCoverage({
    changed,
    lcov,
    min: 80,
    root: ROOT,
  });

  assert.equal(result.total, 2);
  assert.equal(result.covered, 1);
  assert.equal(result.pass, false);
  assert.deepEqual(result.missing, ['src/app/a.service.ts:2']);
});

test('computeDiffCoverage no confunde archivos con el mismo nombre base', () => {
  const lcov = parseLcov(
    [
      'SF:src/app/a.service.ts',
      'DA:10,1',
      'end_of_record',
      'SF:src/app/otro/a.service.ts',
      'DA:10,0',
      'end_of_record',
    ].join('\n'),
  );
  const changed = new Map([
    ['src/app/a.service.ts', new Set([10])],
    ['frontend-app/src/app/otro/a.service.ts', new Set([10])],
  ]);

  const result = computeDiffCoverage({ changed, lcov, min: 80, root: ROOT });

  assert.equal(result.total, 2);
  assert.equal(result.covered, 1);
  assert.deepEqual(result.missing, ['src/app/otro/a.service.ts:10']);
});

test('computeDiffCoverage ignora archivos y líneas no instrumentadas', () => {
  const changed = new Map([
    ['src/app/modelo.ts', new Set([1])],
    ['src/app/a.service.ts', new Set([1, 99])],
  ]);
  const result = computeDiffCoverage({
    changed,
    lcov: parseLcov(LCOV),
    min: 80,
    root: ROOT,
  });

  assert.equal(result.total, 1);
  assert.equal(result.pass, true);
});

test('evaluateCoverage acepta un diff vacío como éxito sin exigir lcov', () => {
  const result = evaluateCoverage({
    base: 'origin/main',
    lcovPath: 'lcov.info',
    exists: () => false,
    read: () => LCOV,
    git: () => ({ ok: true, diff: '' }),
    root: ROOT,
  });

  assert.equal(result.code, 0);
  assert.match(result.message, /sin líneas ejecutables cambiadas/);
});

test('evaluateCoverage pide el lcov cuando el diff toca src/app instrumentado', () => {
  const diff = [
    ...diffLine('frontend-app/src/app/features/x/adapters/a.service.ts'),
    '@@ -1,0 +1,1 @@',
    '+uno',
  ].join('\n');
  const result = evaluateCoverage({
    base: 'origin/main',
    lcovPath: 'lcov.info',
    exists: () => false,
    read: () => LCOV,
    git: () => ({ ok: true, diff }),
    root: ROOT,
  });

  assert.equal(result.code, 1);
  assert.match(result.error, /No se encontró lcov\.info/);
});

test('evaluateCoverage no exige lcov si el diff solo toca archivos no instrumentados', () => {
  const diff = [
    ...diffLine('frontend-app/src/app/features/domains/reports/models/report-metrics.ts'),
    '@@ -1,0 +1,1 @@',
    '+modelo',
    ...diffLine('frontend-app/src/app/features/domains/reports/components/panel.component.html'),
    '@@ -1,0 +1,1 @@',
    '+<p>plantilla</p>',
  ].join('\n');
  const result = evaluateCoverage({
    base: 'origin/main',
    lcovPath: 'lcov.info',
    exists: () => false,
    read: () => LCOV,
    git: () => ({ ok: true, diff }),
    root: ROOT,
  });

  assert.equal(result.code, 0);
  assert.match(result.message, /sin líneas instrumentadas/);
});

test('evaluateCoverage falla cuando Git no puede generar el diff', () => {
  const result = evaluateCoverage({
    base: 'origin/main',
    lcovPath: 'lcov.info',
    exists: () => true,
    read: () => LCOV,
    git: () => ({ ok: false, error: 'bad revision' }),
    root: ROOT,
  });

  assert.equal(result.code, 1);
  assert.match(result.error, /No se pudo obtener el diff de Git/);
  assert.match(result.error, /bad revision/);
});

test('evaluateCoverage falla con la fixture de rutas que motivó la regresión', () => {
  const diff = [
    ...diffLine('frontend-app/src/app/a.service.ts'),
    '@@ -1,0 +1,2 @@',
    '+uno',
    '+dos',
  ].join('\n');
  const result = evaluateCoverage({
    base: 'origin/main',
    lcovPath: 'lcov.info',
    exists: () => true,
    read: () => LCOV,
    git: () => ({ ok: true, diff }),
    root: ROOT,
  });

  assert.equal(result.code, 1);
  assert.equal(result.result.total, 2);
  assert.equal(result.result.covered, 1);
  assert.match(result.error, /src\/app\/a\.service\.ts:2/);
});

test('gitDiff distingue un diff vacío de un error y usa un cwd explícito', () => {
  const empty = gitDiff('HEAD', { cwd: appRoot });
  assert.equal(empty.ok, true);
  assert.equal(empty.diff, '');

  const invalidRef = gitDiff('refs/heads/__no_existe__', { cwd: appRoot });
  assert.equal(invalidRef.ok, false);
  assert.ok(invalidRef.error.length > 0);

  const invalidCwd = gitDiff('HEAD', { cwd: `${appRoot}/__no_existe__` });
  assert.equal(invalidCwd.ok, false);
});

test('gitDiff ignora diff.relative del repositorio y usa el cwd indicado', () => {
  const repo = mkdtempSync(join(tmpdir(), 'diff-coverage-'));
  try {
    const app = join(repo, 'frontend-app');
    mkdirSync(join(app, 'src', 'app'), { recursive: true });
    execFileSync('git', ['init', '--quiet'], { cwd: repo });
    execFileSync('git', ['config', 'user.name', 'Diff Coverage'], { cwd: repo });
    execFileSync('git', ['config', 'user.email', 'diff-coverage@example.test'], { cwd: repo });
    execFileSync('git', ['config', 'diff.relative', 'true'], { cwd: repo });
    writeFileSync(join(app, 'src', 'app', 'a.ts'), 'uno\n');
    execFileSync('git', ['add', '.'], { cwd: repo });
    execFileSync('git', ['-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'base'], {
      cwd: repo,
    });
    const base = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
    writeFileSync(join(app, 'src', 'app', 'a.ts'), 'uno\ndos\n');
    execFileSync('git', ['add', '.'], { cwd: repo });
    execFileSync('git', ['-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'cambio'], {
      cwd: repo,
    });

    const result = gitDiff(base, { cwd: app });

    assert.equal(result.ok, true);
    assert.match(result.diff, /^\+\+\+ b\/frontend-app\/src\/app\/a\.ts$/m);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
