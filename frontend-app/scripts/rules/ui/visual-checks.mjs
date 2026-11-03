/**
 * Guardas del sistema visual Glass (R-UX-7).
 *
 * Verifica que `src/styles.css` sea la única fuente de verdad de los tokens
 * `--glass-*`, las utilidades `.glass*` y los primitivos globales, y que no se
 * reimplementen en estilos de componentes.
 */
import { relative, sep } from 'node:path';
import { appRoot, resolveInApp } from '../../engine/lib/paths.mjs';
import { readText, walkFiles } from '../../engine/lib/fs.mjs';
import { lineAt } from '../../engine/lib/source.mjs';

const stylesRel = 'src/styles.css';
const stylesPath = resolveInApp(stylesRel);
const srcRoot = resolveInApp('src');
const toRel = (path) => relative(appRoot, path).split(sep).join('/');

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

const REQUIRED_DARK_TOKENS = [
  '--glass-bg',
  '--glass-bg-hover',
  '--glass-bg-strong',
  '--glass-bg-subtle',
  '--glass-border',
  '--glass-border-strong',
  '--glass-border-subtle',
  '--glass-text',
  '--glass-text-secondary',
  '--glass-text-muted',
  '--glass-shadow-sm',
  '--glass-shadow-md',
  '--glass-shadow-lg',
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

/** Selectores que el fallback sin `backdrop-filter` debe cubrir con fondo opaco. */
const FALLBACK_SELECTORS = ['.glass', '.card', '.input', '.badge', '.icon-btn'];

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

/** Hallazgos de R-UX-7. */
export function findGlassSystemViolations() {
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

  for (const token of REQUIRED_DARK_TOKENS) {
    if (!new RegExp(`${token}\\s*:`).test(darkBody)) {
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
    for (const selector of FALLBACK_SELECTORS) {
      if (!containsSelector(fallback, selector)) {
        findings.push(
          finding(stylesRel, 0, `el fallback no cubre ${selector}`, `fallback:${selector}`),
        );
      }
    }
  }

  for (const file of walkFiles(srcRoot, (name) => name.endsWith('.css'))) {
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

  return findings;
}
