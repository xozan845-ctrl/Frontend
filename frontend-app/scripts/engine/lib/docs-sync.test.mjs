import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDocsSync } from './docs-sync.mjs';

const gates = [
  {
    id: 'app-logic',
    when: [/^src\/app\/.+\.ts$/],
    exclude: [/\.spec\.ts$/],
    require: [/^docs\//, /^README\.md$/],
    reason: 'la lógica debe reflejarse en docs',
  },
];

test('activa la compuerta si cambia lógica y no hay docs', () => {
  const findings = evaluateDocsSync(['src/app/features/cart/cart.store.ts'], { gates });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].gate, 'app-logic');
});

test('no activa la compuerta si también cambia un doc requerido', () => {
  const findings = evaluateDocsSync(
    ['src/app/features/cart/cart.store.ts', 'docs/rules/frontend/06-estado-signal-store.md'],
    { gates },
  );
  assert.deepEqual(findings, []);
});

test('ignora los archivos excluidos (specs)', () => {
  const findings = evaluateDocsSync(['src/app/features/cart/cart.store.spec.ts'], { gates });
  assert.deepEqual(findings, []);
});

test('respeta las excepciones justificadas', () => {
  const findings = evaluateDocsSync(['src/app/features/cart/cart.store.ts'], {
    gates,
    exemptions: [{ paths: [/cart\.store\.ts$/], reason: 'refactor sin cambio de contrato' }],
  });
  assert.deepEqual(findings, []);
});

test('evalúa varias compuertas de forma independiente', () => {
  const multi = [
    ...gates,
    {
      id: 'ci',
      when: [/^\.github\/workflows\//],
      require: [/^docs\/rules\/ci\//],
      reason: 'CI debe documentarse',
    },
  ];
  const findings = evaluateDocsSync(['.github/workflows/ci.yml'], { gates: multi });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].gate, 'ci');
});
