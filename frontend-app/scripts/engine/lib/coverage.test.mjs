import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeRuleCoverage } from './coverage.mjs';

const defined = new Set(['R-AR-1', 'R-AR-2', 'R-DO-9']);

test('separa reglas verificadas de las contextuales', () => {
  const result = analyzeRuleCoverage({
    suites: [
      { id: 'a', rules: ['R-AR-1'], cites: ['R-AR-2'] },
      { id: 'b', rules: ['R-AR-2'] },
    ],
    definedIds: defined,
  });

  assert.deepEqual(result.verified, ['R-AR-1', 'R-AR-2']);
  assert.deepEqual(result.contextual, []);
  assert.deepEqual(result.unknown, []);
});

test('marca como contextual lo que nadie verifica', () => {
  const result = analyzeRuleCoverage({
    suites: [{ id: 'a', rules: ['R-AR-1'], cites: ['R-DO-9'] }],
    definedIds: defined,
  });

  assert.deepEqual(result.contextual, ['R-DO-9']);
});

test('detecta IDs citados sin definición en docs', () => {
  const result = analyzeRuleCoverage({
    suites: [{ id: 'a', rules: ['R-XX-1'], cites: ['R-YY-2'] }],
    definedIds: defined,
  });

  assert.deepEqual(result.unknown, [
    { suite: 'a', id: 'R-XX-1', kind: 'rules' },
    { suite: 'a', id: 'R-YY-2', kind: 'cites' },
  ]);
});

test('detecta una regla declarada como rules y cites a la vez', () => {
  const result = analyzeRuleCoverage({
    suites: [{ id: 'a', rules: ['R-AR-1'], cites: ['R-AR-1'] }],
    definedIds: defined,
  });

  assert.deepEqual(result.duplicates, [{ suite: 'a', id: 'R-AR-1' }]);
});

test('falla cuando la cobertura baja del suelo', () => {
  const result = analyzeRuleCoverage({
    suites: [{ id: 'a', rules: ['R-AR-1'] }],
    definedIds: defined,
    minVerified: 2,
  });

  assert.equal(result.belowFloor, true);
  assert.equal(result.minVerified, 2);
});
