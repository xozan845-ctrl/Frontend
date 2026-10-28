import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLcov, parseUnifiedDiff, computeDiffCoverage } from './check-diff-coverage.mjs';

const LCOV = [
  'SF:/repo/frontend-app/src/app/a.service.ts',
  'DA:1,1',
  'DA:2,0',
  'DA:3,2',
  'end_of_record',
].join('\n');

test('parseLcov mapea archivos y hits', () => {
  const lcov = parseLcov(LCOV);

  assert.equal(lcov.get('/repo/frontend-app/src/app/a.service.ts').get(2), 0);
  assert.equal(lcov.get('/repo/frontend-app/src/app/a.service.ts').get(3), 2);
});

test('parseUnifiedDiff extrae las líneas nuevas de cada hunk', () => {
  const diff = [
    'diff --git a/src/app/a.service.ts b/src/app/a.service.ts',
    '--- a/src/app/a.service.ts',
    '+++ b/src/app/a.service.ts',
    '@@ -1,0 +1,2 @@',
    '+linea nueva',
    '+otra',
  ].join('\n');

  assert.deepEqual([...parseUnifiedDiff(diff).get('src/app/a.service.ts')], [1, 2]);
});

test('computeDiffCoverage falla cuando una línea cambiada no está cubierta', () => {
  const changed = new Map([['src/app/a.service.ts', new Set([1, 2])]]);
  const result = computeDiffCoverage({ changed, lcov: parseLcov(LCOV), min: 80 });

  assert.equal(result.total, 2);
  assert.equal(result.covered, 1);
  assert.equal(result.pass, false);
  assert.deepEqual(result.missing, ['src/app/a.service.ts:2']);
});

test('computeDiffCoverage ignora archivos y líneas no instrumentadas', () => {
  const changed = new Map([
    ['src/app/modelo.ts', new Set([1])],
    ['src/app/a.service.ts', new Set([1, 99])],
  ]);
  const result = computeDiffCoverage({ changed, lcov: parseLcov(LCOV), min: 80 });

  assert.equal(result.total, 1);
  assert.equal(result.pass, true);
});
