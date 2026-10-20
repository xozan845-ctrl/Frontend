import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { validateManifest } from './runner.mjs';
import { scriptsRoot } from './lib/paths.mjs';

const suite = (id, file) => ({ id, file: resolve(scriptsRoot, file) });

test('validateManifest acepta manifiesto y suites coincidentes', () => {
  const suites = [suite('a', 'rules/a.test.mjs'), suite('b', 'rules/b.test.mjs')];
  const required = [
    { id: 'a', file: 'rules/a.test.mjs' },
    { id: 'b', file: 'rules/b.test.mjs' },
  ];

  assert.doesNotThrow(() => validateManifest(suites, required));
});

test('validateManifest falla si falta una suite obligatoria', () => {
  const required = [{ id: 'a', file: 'rules/a.test.mjs' }];
  assert.throws(() => validateManifest([], required), /Faltan suites obligatorias/);
});

test('validateManifest falla ante suites fuera del manifiesto', () => {
  const suites = [suite('a', 'rules/a.test.mjs'), suite('extra', 'rules/extra.test.mjs')];
  const required = [{ id: 'a', file: 'rules/a.test.mjs' }];

  assert.throws(() => validateManifest(suites, required), /fuera del manifiesto/);
});

test('validateManifest falla si el archivo no coincide con el manifiesto', () => {
  const suites = [suite('a', 'rules/otra.test.mjs')];
  const required = [{ id: 'a', file: 'rules/a.test.mjs' }];

  assert.throws(() => validateManifest(suites, required), /no coincide con el manifiesto/);
});

test('validateManifest falla ante IDs duplicados', () => {
  const suites = [suite('a', 'rules/a.test.mjs'), suite('a', 'rules/b.test.mjs')];
  const required = [{ id: 'a', file: 'rules/a.test.mjs' }];

  assert.throws(() => validateManifest(suites, required), /IDs de suite duplicados/);
});
