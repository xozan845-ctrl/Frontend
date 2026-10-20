import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractImports,
  extractInjections,
  extractTypeDeclarations,
  hasRuntimeCode,
  injectsHttpClient,
  isDerivedConstType,
  maskSource,
} from './lib/source.mjs';

test('maskSource conserva líneas y oculta comentarios y strings', () => {
  const src = [
    "const a = 'type Fake = string'; // interface Falsa",
    '/* interface TambienFalsa */',
    'const b = `type Otra = number`;',
    'export interface Real { x: number }',
  ].join('\n');

  const masked = maskSource(src);
  assert.equal(masked.split('\n').length, 4);
  assert.ok(!masked.includes('Fake'));
  assert.ok(!masked.includes('Falsa'));
  assert.ok(!masked.includes('Otra'));
  assert.ok(masked.includes('Real'));
});

test('extractImports lee imports estáticos, side-effect y dinámicos', () => {
  const src = [
    "import { A } from './a';",
    "import './styles.css';",
    "export type { B } from './b';",
    "const c = await import('./c');",
  ].join('\n');

  const specifiers = extractImports(src).map((entry) => entry.specifier);
  assert.deepEqual(specifiers.sort(), ['./a', './b', './c', './styles.css']);
});

test('extractTypeDeclarations detecta interface, type y enum (no re-exports)', () => {
  const src = [
    'export interface Product { id: string }',
    'type Status = "a" | "b";',
    'export type { Other } from "./other";',
    'enum Color { Red }',
  ].join('\n');

  const names = extractTypeDeclarations(src).map((entry) => entry.name);
  assert.deepEqual(names, ['Product', 'Status', 'Color']);
});

test('extractInjections e injectsHttpClient', () => {
  const src = 'private http = inject(HttpClient);\nprivate store = inject(AuthStore);';
  assert.deepEqual(
    extractInjections(src).map((entry) => entry.token),
    ['HttpClient', 'AuthStore'],
  );
  assert.equal(injectsHttpClient(src), true);
  assert.equal(injectsHttpClient('inject(AuthStore)'), false);
});

test('hasRuntimeCode distingue archivos de sólo tipos', () => {
  assert.equal(hasRuntimeCode('export interface A { x: number }'), false);
  assert.equal(hasRuntimeCode('export const DEFAULT = 1;'), true);
  assert.equal(hasRuntimeCode('@Component({}) class C {}'), true);
});

test('isDerivedConstType reconoce tipos derivados de una constante', () => {
  const src = 'export type Category = (typeof CATEGORIES)[number];';
  const [declaration] = extractTypeDeclarations(src);
  assert.equal(isDerivedConstType(src, declaration), true);
  assert.equal(
    isDerivedConstType('export type Status = "a" | "b";', { name: 'Status', kind: 'type' }),
    false,
  );
});
