import assert from 'node:assert/strict';
import test from 'node:test';
import { hasAdoptedSurface, hasRawSurface } from './adoption-checks.mjs';

test('hasRawSurface detecta fondos de superficie y excluye variantes/tintes', () => {
  assert.equal(hasRawSurface('bg-white'), true);
  assert.equal(hasRawSurface('bg-white/80'), true);
  assert.equal(hasRawSurface('bg-white/10'), false);
  assert.equal(hasRawSurface('hover:bg-slate-100'), false);
  assert.equal(hasRawSurface('dark:bg-surface-900'), false);
  assert.equal(hasRawSurface('bg-slate-100/80'), true);
  assert.equal(hasRawSurface('bg-red-50'), true);
  assert.equal(hasRawSurface('bg-black/40'), false);
});

test('hasAdoptedSurface reconoce utilidades y primitivos globales', () => {
  assert.equal(hasAdoptedSurface('card bg-white'), true);
  assert.equal(hasAdoptedSurface('glass-subtle bg-white'), true);
  assert.equal(hasAdoptedSurface('btn btn-primary'), true);
  assert.equal(hasAdoptedSurface('badge badge-success'), true);
  assert.equal(hasAdoptedSurface('alert alert-danger'), true);
  assert.equal(hasAdoptedSurface('bg-white'), false);
});
