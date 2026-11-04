/**
 * Guardas del sistema visual Glass (R-UX-7).
 *
 * Verifica que `src/styles.css` sea la única fuente de verdad de los tokens
 * `--glass-*`, las utilidades `.glass*` y los primitivos globales; que las
 * plantillas no reimplementen cristal a mano; y que exista paridad de tokens
 * claro/oscuro y fallback sin `backdrop-filter`.
 */
import { existsSync } from 'node:fs';
import { relative, sep } from 'node:path';
import { appRoot, resolveInApp, resolveInRepo } from '../../engine/lib/paths.mjs';
import { readText, walkFiles } from '../../engine/lib/fs.mjs';
import { lineAt } from '../../engine/lib/source.mjs';

const stylesRel = 'src/styles.css';
const stylesPath = resolveInApp(stylesRel);
const srcRoot = resolveInApp('src');
const appRootDir = resolveInApp('src/app');
const toRel = (path) => relative(appRoot, path).split(sep).join('/');

const STYLE_EXTENSIONS = ['.css', '.scss', '.sass', '.less'];
const isStyleFile = (name) => STYLE_EXTENSIONS.some((extension) => name.endsWith(extension));

const REQUIRED_TOKENS = [
  '--glass-bg',
  '--glass-bg-hover',
  '--glass-bg-strong',
  '--glass-bg-subtle',
  '--glass-border',
  '--glass-border-strong',
  '--glass-border-subtle',
  '--glass-blur',
  '--glass-blur-sm',
  '--glass-saturate',
  '--glass-radius-md',
  '--glass-radius-xl',
  '--glass-radius-pill',
  '--glass-text',
  '--glass-text-secondary',
  '--glass-text-muted',
  '--glass-accent',
  '--glass-accent-soft',
  '--glass-accent-blue',
  '--glass-accent-emerald',
  '--glass-shadow-sm',
  '--glass-shadow-md',
  '--glass-shadow-lg',
  '--glass-t-fast',
  '--glass-t-base',
];

const REQUIRED_UTILITIES = [
  '.glass',
  '.glass-strong',
  '.glass-subtle',
  '.glass-hover',
  '.glass-card',
  '.glass-bar',
  '.glass-footer',
];

const REQUIRED_PRIMITIVES = ['.card', '.btn', '.input', '.badge', '.icon-btn'];

/** Tokens que no cambian entre tema claro y oscuro. */
const THEME_INDEPENDENT_TOKEN = /--glass-(?:blur|saturate|radius|t-)/;
const THEME_ACCENT_TOKEN = /--glass-accent/;

/** Selectores con `backdrop-filter` que no necesitan fondo opaco de fallback. */
const FALLBACK_ALLOWLIST = new Set(['.btn']);

/**
 * Excepciones legítimas en plantillas. No son superficies de cristal:
 * scrims de modales, controles de baja opacidad y etiquetas sobre imagen.
 */
const classTokens = (classes) => classes.split(/\s+/).filter(Boolean);
const baseTokens = (classes) => classTokens(classes).filter((token) => !token.includes(':'));
const hasBaseToken = (classes, pattern) => baseTokens(classes).some((token) => pattern.test(token));

/** Requisitos del sistema Glass y si tienen verificación automática. */
export const GLASS_REQUIREMENTS = [
  { id: 'tokens-light', implemented: true, description: 'tokens --glass-* en :root' },
  { id: 'tokens-dark', implemented: true, description: 'paridad de tokens en .dark' },
  { id: 'utilities', implemented: true, description: 'utilidades .glass*' },
  { id: 'primitives', implemented: true, description: 'primitivos con tokens Glass' },
  { id: 'ambient', implemented: true, description: 'fondos ambientales con gradientes' },
  { id: 'fallback', implemented: true, description: 'fallback sin backdrop-filter' },
  { id: 'no-css-reimplementation', implemented: true, description: 'sin cristal a mano en CSS' },
  {
    id: 'no-template-reimplementation',
    implemented: true,
    description: 'sin cristal a mano en plantillas',
  },
  {
    id: 'no-apply-reimplementation',
    implemented: true,
    description: 'sin cristal a mano vía @apply',
  },
  { id: 'page-shells', implemented: true, description: 'shells de página con fondo ambiental' },
  { id: 'dark-parity-derived', implemented: true, description: 'paridad de tokens derivada' },
  {
    id: 'fallback-derived',
    implemented: true,
    description: 'fallback derivado de backdrop-filter',
  },
  { id: 'allowlist', implemented: true, description: 'allowlist documentada de excepciones' },
  {
    id: 'visual-regression',
    implemented: true,
    description: 'regresión visual con Playwright (claro/oscuro/fallback)',
  },
  {
    id: 'stylelint',
    implemented: true,
    description: 'regla stylelint para propiedades de cristal',
  },
];

/** Cobertura de requisitos Glass (implementados / total). */
export function getGlassCoverage() {
  const implemented = GLASS_REQUIREMENTS.filter((requirement) => requirement.implemented).length;
  const total = GLASS_REQUIREMENTS.length;
  return {
    implemented,
    total,
    percent: total === 0 ? 0 : (implemented / total) * 100,
    pending: GLASS_REQUIREMENTS.filter((requirement) => !requirement.implemented).map(
      (requirement) => requirement.id,
    ),
  };
}

const finding = (file, line, detail, suffix) => ({
  rule: 'R-UX-7',
  file,
  line,
  detail,
  key: `${file}|R-UX-7|${suffix}`,
});

const stripCssComments = (css) =>
  css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));

/** Bloques `selector { declaraciones }` (incluye reglas dentro de at-rules). */
function findBlocks(css) {
  const blocks = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let match;

  while ((match = re.exec(css))) {
    const selector = match[1].trim();
    if (!selector || selector.startsWith('@')) continue;
    blocks.push({ selector, body: match[2], index: match.index });
  }

  return blocks;
}

const selectorsOf = (selector) =>
  selector
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

const matchesClass = (selector, className) =>
  selector === className ||
  selector.startsWith(`${className}:`) ||
  selector.startsWith(`${className}.`) ||
  selector.startsWith(`${className} `);

const findBlock = (blocks, className) =>
  blocks.find((block) => selectorsOf(block.selector).some((sel) => matchesClass(sel, className)));

/** Última definición por cascada (la que gana dentro del mismo archivo). */
const findLastBlock = (blocks, className) =>
  blocks.findLast((block) =>
    selectorsOf(block.selector).some((sel) => matchesClass(sel, className)),
  );

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** ¿El texto contiene el selector exacto seguido de coma o llave? */
const containsSelector = (text, selector) =>
  new RegExp(`${escapeRegExp(selector)}\\s*[,{]`).test(text);

/** Extrae el bloque completo de un at-rule (con llaves anidadas). */
function extractAtRuleBlock(css, pattern) {
  const match = pattern.exec(css);
  if (!match) return null;

  let depth = 0;
  let started = false;

  for (let index = match.index; index < css.length; index += 1) {
    if (css[index] === '{') {
      depth += 1;
      started = true;
    } else if (css[index] === '}') {
      depth -= 1;
      if (started && depth === 0) return css.slice(match.index, index + 1);
    }
  }

  return null;
}

const tokensIn = (body) => [
  ...new Set([...body.matchAll(/--glass-[a-z0-9-]+(?=\s*:)/g)].map((match) => match[0])),
];

/** Requisitos de definición: tokens, utilidades, primitivos, fondos y fallback. */
export function findGlassDefinitionViolations() {
  const findings = [];
  const css = stripCssComments(readText(stylesPath));
  const blocks = findBlocks(css);
  const fallbackHeader = /@supports\s+not\s*\(\s*backdrop-filter/;
  const fallbackMatch = fallbackHeader.exec(css);
  const cascadeBlocks = fallbackMatch
    ? blocks.filter((block) => block.index < fallbackMatch.index)
    : blocks;

  const rootBody = blocks
    .filter((block) => selectorsOf(block.selector).includes(':root'))
    .map((block) => block.body)
    .join('\n');
  const darkBody = blocks
    .filter((block) => selectorsOf(block.selector).includes('.dark'))
    .map((block) => block.body)
    .join('\n');

  for (const token of REQUIRED_TOKENS) {
    if (!new RegExp(`${token}\\s*:`).test(rootBody)) {
      findings.push(finding(stylesRel, 0, `falta el token ${token} en :root`, `token:${token}`));
    }
  }

  const rootTokens = tokensIn(rootBody);
  const darkTokens = tokensIn(darkBody);
  const themeTokens = rootTokens.filter(
    (token) => !THEME_INDEPENDENT_TOKEN.test(token) && !THEME_ACCENT_TOKEN.test(token),
  );

  for (const token of themeTokens) {
    if (!darkTokens.includes(token)) {
      findings.push(
        finding(stylesRel, 0, `falta el token ${token} en .dark`, `dark-token:${token}`),
      );
    }
  }

  for (const utility of REQUIRED_UTILITIES) {
    if (!findBlock(blocks, utility)) {
      findings.push(finding(stylesRel, 0, `falta la utilidad ${utility}`, `utility:${utility}`));
    }
  }

  for (const primitive of REQUIRED_PRIMITIVES) {
    const block = findLastBlock(cascadeBlocks, primitive);

    if (!block) {
      findings.push(
        finding(stylesRel, 0, `falta el primitivo ${primitive}`, `primitive:${primitive}`),
      );
      continue;
    }

    if (!/var\(--glass-[a-z0-9-]+\)/.test(block.body)) {
      findings.push(
        finding(
          stylesRel,
          lineAt(css, block.index),
          `${primitive} no hereda tokens --glass-*`,
          `primitive-token:${primitive}`,
        ),
      );
    }
  }

  const lightBody = blocks
    .filter(
      (block) => selectorsOf(block.selector).includes('body') && !block.selector.includes('.dark'),
    )
    .map((block) => block.body)
    .join('\n');
  if (!/gradient\(/.test(lightBody)) {
    findings.push(
      finding(stylesRel, 0, 'el fondo ambiental claro no usa gradientes', 'ambient:light'),
    );
  }

  const darkAmbientBody = blocks
    .filter((block) =>
      selectorsOf(block.selector).some((sel) => sel === '.dark body' || sel === 'body.dark'),
    )
    .map((block) => block.body)
    .join('\n');
  if (!/gradient\(/.test(darkAmbientBody)) {
    findings.push(
      finding(stylesRel, 0, 'el fondo ambiental oscuro no usa gradientes', 'ambient:dark'),
    );
  }

  const fallback = extractAtRuleBlock(css, fallbackHeader);
  if (!fallback) {
    findings.push(
      finding(
        stylesRel,
        0,
        'falta el fallback @supports not (backdrop-filter: ...)',
        'fallback:missing',
      ),
    );
  } else {
    const backdropSelectors = blocks
      .filter((block) => /(?:^|[^-])backdrop-filter\s*:/.test(block.body))
      .flatMap((block) => selectorsOf(block.selector))
      .filter((selector) => !selector.includes(':hover') && !selector.includes(':focus'))
      .filter((selector) => !FALLBACK_ALLOWLIST.has(selector));

    for (const selector of new Set(backdropSelectors)) {
      if (!containsSelector(fallback, selector)) {
        findings.push(
          finding(stylesRel, 0, `el fallback no cubre ${selector}`, `fallback:${selector}`),
        );
      }
    }
  }

  return findings;
}

const isAllowlistedTemplate = (classes) =>
  TEMPLATE_ALLOWLIST.some((exception) => exception.test(classes));

const hasLightSurface = (classes) =>
  hasBaseToken(classes, /^bg-white(?:\/(?:[5-9]\d|100))?$/) ||
  hasBaseToken(classes, /^bg-slate-50$/) ||
  hasBaseToken(classes, /^bg-surface-/);

const hasPageHeight = (classes) =>
  hasBaseToken(classes, /^min-h-screen$/) || hasBaseToken(classes, /^min-h-\[(?:70|80)vh\]$/);
const hasFlatPageBackground = (classes) =>
  hasBaseToken(classes, /^bg-slate-50$/) ||
  hasBaseToken(classes, /^bg-gradient-to-b$/) ||
  hasBaseToken(classes, /^bg-white$/);
const hasAmbientBackground = (classes) => hasBaseToken(classes, /^app-(?:page|shell)-bg$/);

const TEMPLATE_ALLOWLIST = [
  {
    id: 'overlay-scrim',
    test: (classes) =>
      hasBaseToken(classes, /^(?:fixed|absolute)$/) &&
      hasBaseToken(classes, /^inset-0$/) &&
      !hasLightSurface(classes),
  },
  {
    id: 'low-opacity',
    test: (classes) => hasBaseToken(classes, /^bg-white\/(?:5|10|20)$/),
  },
  {
    id: 'dark-label',
    test: (classes) =>
      hasBaseToken(classes, /^bg-black\//) && hasBaseToken(classes, /^text-white$/),
  },
];

/** Reimplementaciones en CSS de componentes, `@apply` y estilos inline. */
export function findGlassReimplementationViolations() {
  const findings = [];

  for (const file of walkFiles(srcRoot, isStyleFile)) {
    const rel = toRel(file);
    if (rel === stylesRel) continue;

    const source = stripCssComments(readText(file));

    for (const match of source.matchAll(/--glass-[a-z0-9-]+\s*:/g)) {
      findings.push(
        finding(
          rel,
          lineAt(source, match.index),
          'define un token --glass-* fuera de styles.css',
          `glass-token:${match[0].replace(/\s*:$/, '')}`,
        ),
      );
    }

    for (const match of source.matchAll(/\.glass(?:-[a-z0-9-]+)?\b/g)) {
      findings.push(
        finding(
          rel,
          lineAt(source, match.index),
          'redefine una utilidad .glass* fuera de styles.css',
          `glass-utility:${match[0]}`,
        ),
      );
    }

    for (const match of source.matchAll(/-?backdrop-filter\s*:\s*([^;]+);/g)) {
      const value = match[1].trim();
      if (!value.includes('var(--glass-')) {
        findings.push(
          finding(
            rel,
            lineAt(source, match.index),
            `usa backdrop-filter crudo (${value}); usa los tokens --glass-*`,
            `backdrop:${value}`,
          ),
        );
      }
    }

    for (const match of source.matchAll(/@apply[^;]*backdrop-blur[^;]*;/g)) {
      findings.push(
        finding(
          rel,
          lineAt(source, match.index),
          'reimplementa cristal con @apply backdrop-blur',
          `apply:${match[0].trim()}`,
        ),
      );
    }

    const componentBlocks = findBlocks(source);
    for (const primitive of REQUIRED_PRIMITIVES) {
      const block = findBlock(componentBlocks, primitive);
      if (block) {
        findings.push(
          finding(
            rel,
            lineAt(source, block.index),
            `redefine el primitivo ${primitive} fuera de styles.css`,
            `primitive:${primitive}`,
          ),
        );
      }
    }
  }

  for (const file of walkFiles(appRootDir, (name) => name.endsWith('.html'))) {
    const rel = toRel(file);
    const source = readText(file);

    for (const match of source.matchAll(/style\s*=\s*"[^"]*(?:backdrop-filter|--glass-)[^"]*"/g)) {
      findings.push(
        finding(rel, lineAt(source, match.index), 'usa cristal en un style inline', 'inline-style'),
      );
    }
  }

  for (const file of walkFiles(
    appRootDir,
    (name) => name.endsWith('.ts') && !name.endsWith('.spec.ts'),
  )) {
    const rel = toRel(file);
    const source = readText(file);

    for (const match of source.matchAll(/style\s*:\s*['"`][^'"`]*(?:backdrop-filter|--glass-)/g)) {
      findings.push(
        finding(
          rel,
          lineAt(source, match.index),
          'usa cristal en un estilo inline',
          'inline-style',
        ),
      );
    }
  }

  return findings;
}

/** Reimplementaciones en plantillas y shells de página sin fondo ambiental. */
export function findGlassTemplateViolations() {
  const findings = [];

  for (const file of walkFiles(appRootDir, (name) => name.endsWith('.html'))) {
    const rel = toRel(file);
    const source = readText(file);

    for (const match of source.matchAll(/<[a-z][^>]*class="([^"]*)"[^>]*>/gi)) {
      const classes = match[1];
      if (!/\bbackdrop-blur(?:-|\b)/.test(classes)) continue;
      if (/\bglass(?:-[a-z0-9-]+)?\b/.test(classes)) continue;
      if (isAllowlistedTemplate(classes)) continue;
      if (!hasLightSurface(classes)) continue;

      findings.push(
        finding(
          rel,
          lineAt(source, match.index),
          'reimplementa una superficie de cristal con backdrop-blur + fondo',
          `template-glass:${classes.trim().slice(0, 80)}`,
        ),
      );
    }

    if (!rel.includes('/pages/')) continue;

    const firstClass = source.match(/class="([^"]*)"/);
    if (!firstClass) continue;

    const classes = firstClass[1];
    if (hasAmbientBackground(classes)) continue;
    if (!hasPageHeight(classes) || !hasFlatPageBackground(classes)) continue;

    findings.push(
      finding(
        rel,
        lineAt(source, firstClass.index),
        'el shell de página usa fondo plano; usa app-page-bg/app-shell-bg',
        'page-shell',
      ),
    );
  }

  return findings;
}

/** Verifica que stylelint y la regresión visual estén cableados en CI. */
export function findGlassToolingViolations() {
  const findings = [];
  const packageJson = JSON.parse(readText(resolveInApp('package.json')));
  const ci = readText(resolveInRepo('.github/workflows/ci.yml'));

  if (!String(packageJson.scripts?.['lint:css'] ?? '').includes('stylelint')) {
    findings.push(
      finding(
        'package.json',
        0,
        'falta el script lint:css con stylelint',
        'tooling:stylelint-script',
      ),
    );
  }

  const stylelintConfig = resolveInApp('stylelint.config.mjs');
  if (!existsSync(stylelintConfig) || !readText(stylelintConfig).includes('glass/no-raw-glass')) {
    findings.push(
      finding(
        'stylelint.config.mjs',
        0,
        'falta la regla glass/no-raw-glass',
        'tooling:stylelint-config',
      ),
    );
  }

  if (!ci.includes('npm run lint:css')) {
    findings.push(
      finding(
        '.github/workflows/ci.yml',
        0,
        'CI no ejecuta npm run lint:css',
        'tooling:stylelint-ci',
      ),
    );
  }

  const visualSpec = resolveInApp('e2e/glass.visual.spec.ts');
  if (!existsSync(visualSpec) || !readText(visualSpec).includes('toHaveScreenshot')) {
    findings.push(
      finding(
        'e2e/glass.visual.spec.ts',
        0,
        'falta la regresión visual con toHaveScreenshot',
        'tooling:visual-spec',
      ),
    );
  }

  const snapshotsDir = resolveInApp('e2e/glass.visual.spec.ts-snapshots');
  const snapshots = existsSync(snapshotsDir)
    ? walkFiles(snapshotsDir, (name) => name.endsWith('.png')).length
    : 0;
  if (snapshots < 3) {
    findings.push(
      finding(
        'e2e/glass.visual.spec.ts-snapshots',
        0,
        `faltan snapshots visuales (${snapshots})`,
        'tooling:visual-snapshots',
      ),
    );
  }

  if (!ci.includes('npm run e2e')) {
    findings.push(
      finding('.github/workflows/ci.yml', 0, 'CI no ejecuta npm run e2e', 'tooling:visual-ci'),
    );
  }

  return findings;
}

/** Todos los hallazgos de R-UX-7. */
export function findGlassSystemViolations() {
  return [
    ...findGlassDefinitionViolations(),
    ...findGlassReimplementationViolations(),
    ...findGlassTemplateViolations(),
    ...findGlassToolingViolations(),
  ];
}
