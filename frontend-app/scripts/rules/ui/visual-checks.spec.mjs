import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GLASS_REQUIREMENTS,
  TEMPLATE_ALLOWLIST,
  findBlocks,
  findFallbackBlock,
  findGlassAllowlistViolations,
  findGlassDefinitionViolations,
  getGlassCoverage,
  hasFlatPageBackground,
  hasLightSurface,
  hasPageHeight,
  isAllowlistedTemplate,
  isGlassUtilityClass,
  matchesClass,
} from './visual-checks.mjs';

test('isGlassUtilityClass ignora iconos con "glass" en el nombre', () => {
  assert.equal(isGlassUtilityClass('fa-solid fa-magnifying-glass text-xs'), false);
  assert.equal(isGlassUtilityClass('glass mt-4'), true);
  assert.equal(isGlassUtilityClass('glass-card dark:glass-footer'), true);
});

test('matchesClass detecta clases anidadas y compuestas sin confundir prefijos', () => {
  assert.equal(matchesClass('.wrapper .card', '.card'), true);
  assert.equal(matchesClass('.foo.card:hover', '.card'), true);
  assert.equal(matchesClass('.card-title', '.card'), false);
  assert.equal(matchesClass('.card-title', '.card', { variants: true }), true);
  assert.equal(matchesClass('.cardinal', '.card'), false);
});

test('hasLightSurface reconoce superficies claras y opacas', () => {
  assert.equal(hasLightSurface('bg-white'), true);
  assert.equal(hasLightSurface('bg-white/80'), true);
  assert.equal(hasLightSurface('bg-slate-100'), true);
  assert.equal(hasLightSurface('bg-slate-100/80'), true);
  assert.equal(hasLightSurface('bg-surface-100'), true);
  assert.equal(hasLightSurface('bg-surface-900'), false);
  assert.equal(hasLightSurface('bg-black/40'), false);
});

test('hasPageHeight reconoce alturas de viewport y valores arbitrarios', () => {
  assert.equal(hasPageHeight('min-h-screen'), true);
  assert.equal(hasPageHeight('min-h-[calc(100vh-4rem)]'), true);
  assert.equal(hasPageHeight('min-h-[80vh]'), true);
  assert.equal(hasPageHeight('h-10'), false);
});

test('hasFlatPageBackground solo acepta fondos planos de página', () => {
  assert.equal(hasFlatPageBackground('bg-slate-50'), true);
  assert.equal(hasFlatPageBackground('bg-white'), true);
  assert.equal(hasFlatPageBackground('bg-white/80'), false);
  assert.equal(hasFlatPageBackground('bg-black/40'), false);
});

test('la allowlist cubre scrims, baja opacidad y etiquetas oscuras', () => {
  assert.equal(isAllowlistedTemplate('fixed inset-0 bg-black/40 backdrop-blur-sm'), true);
  assert.equal(isAllowlistedTemplate('bg-white/10 backdrop-blur'), true);
  assert.equal(isAllowlistedTemplate('bg-black/60 text-white backdrop-blur'), true);
  assert.equal(isAllowlistedTemplate('fixed inset-0 bg-white backdrop-blur'), false);
});

test('la allowlist tiene IDs únicos y está documentada en la regla', () => {
  const ids = TEMPLATE_ALLOWLIST.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(findGlassAllowlistViolations(), []);
});

test('la cobertura se calcula sobre hallazgos reales, no sobre flags', () => {
  assert.equal(GLASS_REQUIREMENTS.length, 15);
  assert.equal('implemented' in GLASS_REQUIREMENTS[0], false);

  const clean = getGlassCoverage([]);
  assert.equal(clean.percent, 100);
  assert.deepEqual(clean.pending, []);

  const token = getGlassCoverage([{ key: 'src/styles.css|R-UX-7|token:--glass-bg' }]);
  assert.ok(token.percent < 100);
  assert.ok(token.pending.includes('tokens-light'));

  const primitive = getGlassCoverage([{ key: 'src/app/x.css|R-UX-7|redefined-primitive:.card' }]);
  assert.ok(primitive.pending.includes('no-css-reimplementation'));

  const allowlist = getGlassCoverage([
    { key: 'docs/rules/ui/03-experiencia.md|R-UX-7|allowlist:x' },
  ]);
  assert.ok(allowlist.pending.includes('allowlist'));
});

test('el primitivo alert existe y hereda tokens Glass', () => {
  const findings = findGlassDefinitionViolations().filter((finding) =>
    finding.key.includes('primitive:.alert'),
  );
  assert.deepEqual(findings, []);
});

test('findBlocks distingue reglas condicionales de las globales', () => {
  const css = [
    ':root { --glass-bg: #fff; }',
    '@media (min-width: 1px) { .card { background: var(--glass-bg); } }',
    '.dark { --glass-bg: #000; }',
  ].join('\n');

  const blocks = findBlocks(css);
  const root = blocks.find((block) => block.selector === ':root');
  const card = blocks.find((block) => block.selector === '.card');
  const dark = blocks.find((block) => block.selector === '.dark');

  assert.equal(root?.conditional, false);
  assert.equal(dark?.conditional, false);
  assert.equal(card?.conditional, true);
  assert.deepEqual(card?.atRules, ['@media (min-width: 1px)']);
  assert.ok((card?.index ?? 0) > 0);
});

test('findFallbackBlock localiza el @supports de backdrop-filter', () => {
  const css = [
    '.card { color: red; }',
    '@supports not (backdrop-filter: blur(1px)) {',
    '  .card { background: #fff; }',
    '}',
  ].join('\n');

  const fallback = findFallbackBlock(css);
  assert.ok(fallback);
  assert.ok(fallback.text.includes('@supports not (backdrop-filter'));
  assert.ok(fallback.text.includes('.card'));
  assert.equal(findFallbackBlock('.card { color: red; }'), null);
});
