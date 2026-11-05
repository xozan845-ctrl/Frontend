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
  '.app-page-bg',
  '.app-shell-bg',
];

const REQUIRED_PRIMITIVES = ['.card', '.btn', '.input', '.badge', '.icon-btn', '.alert'];

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

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Clase de utilidad Glass real; `fa-magnifying-glass` no debe colar. */
const GLASS_UTILITY_CLASS = /^glass(?:-[a-z0-9-]+)?$/;
export const isGlassUtilityClass = (classes) =>
  classTokens(classes).some((token) => GLASS_UTILITY_CLASS.test(token.replace(/^.*:/, '')));

/**
 * Requisitos del sistema Glass y prefijos de hallazgo que los incumplen.
 * La cobertura se calcula sobre hallazgos reales, no sobre flags manuales.
 */
const GLASS_REQUIREMENT_PREFIXES = [
  { id: 'tokens-light', description: 'tokens --glass-* en :root', prefixes: ['token:'] },
  { id: 'tokens-dark', description: 'paridad de tokens en .dark', prefixes: ['dark-token:'] },
  {
    id: 'utilities',
    description: 'utilidades .glass* y fondos ambientales',
    prefixes: ['utility:'],
  },
  {
    id: 'primitives',
    description: 'primitivos con tokens Glass',
    prefixes: ['primitive:', 'primitive-token:'],
  },
  { id: 'ambient', description: 'fondos ambientales con gradientes', prefixes: ['ambient:'] },
  { id: 'fallback', description: 'fallback sin backdrop-filter', prefixes: ['fallback:'] },
  {
    id: 'no-css-reimplementation',
    description: 'sin cristal a mano en CSS',
    prefixes: ['glass-token:', 'glass-utility:', 'backdrop:', 'redefined-primitive:'],
  },
  {
    id: 'no-template-reimplementation',
    description: 'sin cristal a mano en plantillas',
    prefixes: ['template-glass:'],
  },
  {
    id: 'no-apply-reimplementation',
    description: 'sin cristal a mano vía @apply',
    prefixes: ['apply:'],
  },
  {
    id: 'page-shells',
    description: 'shells de página con fondo ambiental',
    prefixes: ['page-shell:'],
  },
  {
    id: 'dark-parity-derived',
    description: 'paridad de tokens derivada',
    prefixes: ['dark-token:'],
  },
  {
    id: 'fallback-derived',
    description: 'fallback derivado de backdrop-filter',
    prefixes: ['fallback:'],
  },
  {
    id: 'allowlist',
    description: 'allowlist documentada de excepciones',
    prefixes: ['allowlist:'],
  },
  {
    id: 'visual-regression',
    description: 'regresión visual con Playwright (claro/oscuro/fallback)',
    prefixes: ['tooling:visual-'],
  },
  {
    id: 'stylelint',
    description: 'regla stylelint para propiedades de cristal',
    prefixes: ['tooling:stylelint'],
  },
];

/** Requisitos públicos (solo identidad y descripción). */
export const GLASS_REQUIREMENTS = GLASS_REQUIREMENT_PREFIXES.map(({ id, description }) => ({
  id,
  description,
}));

const coversRequirement = (findings, prefixes) =>
  !prefixes.some((prefix) => findings.some((item) => item.key.includes(`|R-UX-7|${prefix}`)));

/** Cobertura real de requisitos Glass (verificados / total). */
export function getGlassCoverage(findings = findGlassSystemViolations()) {
  const results = GLASS_REQUIREMENT_PREFIXES.map((requirement) => ({
    ...requirement,
    implemented: coversRequirement(findings, requirement.prefixes),
  }));
  const implemented = results.filter((requirement) => requirement.implemented).length;
  const total = results.length;
  return {
    implemented,
    total,
    percent: total === 0 ? 0 : (implemented / total) * 100,
    pending: results.filter((requirement) => !requirement.implemented).map(({ id }) => id),
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

/**
 * ¿El selector contiene la clase exacta? Acepta compuestos como
 * `.wrapper .card`, `.foo.card` o `.card:hover`; no confunde `.card-title`.
 * Con `variants` también acepta sufijos de primitivo (`.btn-primary`).
 */
export const matchesClass = (selector, className, { variants = false } = {}) => {
  const name = className.startsWith('.') ? className.slice(1) : className;
  const suffix = variants ? '(?:-[a-z0-9-]+)?' : '';
  return new RegExp(`\\.${escapeRegExp(name)}${suffix}(?![\\w-])`).test(selector);
};

const findBlock = (blocks, className, options) =>
  blocks.find((block) =>
    selectorsOf(block.selector).some((sel) => matchesClass(sel, className, options)),
  );

/** Última definición por cascada (la que gana dentro del mismo archivo). */
const findLastBlock = (blocks, className) =>
  blocks.findLast((block) =>
    selectorsOf(block.selector).some((sel) => matchesClass(sel, className)),
  );

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

export const isAllowlistedTemplate = (classes) =>
  TEMPLATE_ALLOWLIST.some((exception) => exception.test(classes));

const LIGHT_SURFACE =
  /^(?:bg-white|bg-slate-(?:50|100|200)|bg-gray-(?:50|100)|bg-surface-(?:50|100|200|300)|bg-accent-50)(?:\/(?:\d{1,3}|\[[^\]]+\]))?$/;
export const hasLightSurface = (classes) => hasBaseToken(classes, LIGHT_SURFACE);

export const hasPageHeight = (classes) =>
  hasBaseToken(classes, /^(?:min-)?h-(?:screen|full|svh|lvh|dvh|\[[^\]]+\])$/);
export const hasFlatPageBackground = (classes) =>
  hasBaseToken(classes, /^bg-slate-(?:50|100)$/) ||
  hasBaseToken(classes, /^bg-gray-(?:50|100)$/) ||
  hasBaseToken(classes, /^bg-gradient-to-b$/) ||
  hasBaseToken(classes, /^bg-white$/) ||
  hasBaseToken(classes, /^bg-surface-(?:50|100)$/);
const hasAmbientBackground = (classes) => hasBaseToken(classes, /^app-(?:page|shell)-bg$/);

export const TEMPLATE_ALLOWLIST = [
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

const ALLOWLIST_DOCS = 'docs/rules/ui/03-experiencia.md';

/** Cada excepción de la allowlist debe estar documentada en la regla. */
export function findGlassAllowlistViolations() {
  const docs = readText(resolveInApp(ALLOWLIST_DOCS));
  return TEMPLATE_ALLOWLIST.filter(({ id }) => !docs.includes(id)).map(({ id }) =>
    finding(ALLOWLIST_DOCS, 0, `la excepción ${id} no está documentada`, `allowlist:${id}`),
  );
}

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
      const block = findBlock(componentBlocks, primitive, { variants: true });
      if (block) {
        findings.push(
          finding(
            rel,
            lineAt(source, block.index),
            `redefine el primitivo ${primitive} fuera de styles.css`,
            `redefined-primitive:${primitive}`,
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

const attributeValue = (tag, name) => {
  const match = tag.match(new RegExp(`\\s${escapeRegExp(name)}\\s*=\\s*"([^"]*)"`, 'i'));
  return match ? match[1] : '';
};

const STRING_LITERAL = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;

const stringLiterals = (source) => [...source.matchAll(STRING_LITERAL)].map((match) => match[2]);

/** Clases estáticas + cada variante dinámica de `[class]`/`[ngClass]`. */
const classVariants = (tag) => {
  const staticClasses = attributeValue(tag, 'class');
  const dynamic = [
    ...stringLiterals(attributeValue(tag, '[class]')),
    ...stringLiterals(attributeValue(tag, '[ngClass]')),
  ];
  return [staticClasses, ...dynamic.map((value) => `${staticClasses} ${value}`)];
};

const templateGlassFinding = (rel, source, index, classes) => {
  if (!/\bbackdrop-blur(?:-|\b)/.test(classes)) return null;
  if (isGlassUtilityClass(classes)) return null;
  if (isAllowlistedTemplate(classes)) return null;
  if (!hasLightSurface(classes)) return null;

  return finding(
    rel,
    lineAt(source, index),
    'reimplementa una superficie de cristal con backdrop-blur + fondo',
    `template-glass:${classes.trim().slice(0, 80)}`,
  );
};

const addFinding = (findings, seen, candidate) => {
  if (!candidate || seen.has(candidate.key)) return;
  seen.add(candidate.key);
  findings.push(candidate);
};

/** Reimplementaciones en plantillas, bindings y clases inline. */
export function findGlassTemplateViolations() {
  const findings = [];

  for (const file of walkFiles(appRootDir, (name) => name.endsWith('.html'))) {
    const rel = toRel(file);
    const source = readText(file);
    const seen = new Set();

    for (const tag of source.matchAll(/<[a-z][^>]*>/gi)) {
      for (const classes of classVariants(tag[0])) {
        addFinding(findings, seen, templateGlassFinding(rel, source, tag.index, classes));
      }
    }

    if (!rel.includes('/pages/')) continue;

    const rootClass =
      source.match(/<(?:section|div|main|article)\b[^>]*\sclass="([^"]*)"/i) ??
      source.match(/\sclass="([^"]*)"/);
    if (!rootClass) continue;

    const classes = rootClass[1];
    if (hasAmbientBackground(classes)) continue;
    if (!hasPageHeight(classes) || !hasFlatPageBackground(classes)) continue;

    findings.push(
      finding(
        rel,
        lineAt(source, rootClass.index),
        'el shell de página usa fondo plano; usa app-page-bg/app-shell-bg',
        'page-shell',
      ),
    );
  }

  for (const file of walkFiles(
    appRootDir,
    (name) => name.endsWith('.ts') && !name.endsWith('.spec.ts'),
  )) {
    const rel = toRel(file);
    const source = readText(file);
    const seen = new Set();

    for (const literal of source.matchAll(STRING_LITERAL)) {
      const value = literal[2];
      if (!value.includes('backdrop-blur')) continue;

      const tags = [...value.matchAll(/<[a-z][^>]*>/gi)];
      if (tags.length === 0) {
        addFinding(findings, seen, templateGlassFinding(rel, source, literal.index, value));
        continue;
      }

      for (const tag of tags) {
        for (const classes of classVariants(tag[0])) {
          addFinding(findings, seen, templateGlassFinding(rel, source, literal.index, classes));
        }
      }
    }
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
    ...findGlassAllowlistViolations(),
    ...findGlassToolingViolations(),
  ];
}
