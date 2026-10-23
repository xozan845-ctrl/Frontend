/**
 * Guardas de presentación (R-SO-8 + R-ST-3): los componentes presentacionales
 * no conocen stores y las páginas no derivan estado de dominio; los derivados
 * viven en `withComputed` del store.
 *
 * El análisis es estático y conservador: solo marca derivados que leen señales
 * de un store inyectado. Un `computed` sobre estado local de UI (un modal, un
 * borrador) no es un hallazgo.
 */
import { relative, sep } from 'node:path';
import { appRoot, resolveInApp } from '../../engine/lib/paths.mjs';
import { readText, walkFiles } from '../../engine/lib/fs.mjs';
import { extractImports, extractInjections, lineAt, maskSource } from '../../engine/lib/source.mjs';

const featuresRoot = resolveInApp('src/app/features');
const sharedUiRoot = resolveInApp('src/app/shared/ui');
const toRel = (path) => relative(appRoot, path).split(sep).join('/');
const isSpec = (rel) => rel.endsWith('.spec.ts');

/** Palabras clave que no son llamadas a helpers de dominio. */
const CONTROL_KEYWORDS = new Set([
  'if',
  'for',
  'while',
  'switch',
  'catch',
  'return',
  'function',
  'typeof',
  'instanceof',
  'new',
  'await',
  'yield',
  'constructor',
]);

/**
 * Extrae los stores inyectados y el nombre de la propiedad que los recibe:
 * `private readonly productStore = inject(ProductStore)` → `productStore`.
 * @returns {Map<string, string>} propiedad → token
 */
function storeBindings(src) {
  const masked = maskSource(src);
  const bindings = new Map();
  const re =
    /(?:^|\n)\s*(?:(?:public|private|protected|readonly)\s+)*([A-Za-z_$][\w$]*)\s*(?::[^=;\n]+)?\s*=\s*inject\s*\(\s*([A-Za-z_$][\w$]*)\s*\)/g;
  let match;
  while ((match = re.exec(masked))) {
    if (match[2].endsWith('Store')) bindings.set(match[1], match[2]);
  }
  return bindings;
}

/** Índice del paréntesis/llave de cierre correspondiente. */
function closingIndex(src, openIndex) {
  const open = src[openIndex];
  const close = open === '(' ? ')' : open === '{' ? '}' : open === '[' ? ']' : null;
  if (!close) return -1;
  let depth = 0;
  for (let i = openIndex; i < src.length; i += 1) {
    if (src[i] === open) depth += 1;
    else if (src[i] === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Nombre de la propiedad/computed a partir del texto anterior a `computed(`. */
function computedName(prefix, fallback) {
  const match = prefix.match(/([A-Za-z_$][\w$]*)\s*(?::[^=;\n]*)?=\s*$/);
  return match?.[1] ?? fallback;
}

/**
 * ¿El cuerpo deriva estado de dominio a partir de un store?
 * Señales seguras: leer una señal (`store.items()`) o una propiedad.
 * Señales de derivación: transformar colecciones, llamar métodos del store con
 * argumentos, hacer aritmética, combinar dos stores o llamar helpers con datos
 * del store.
 */
function isDomainDerivation(body, bindings) {
  const usedStores = new Set();
  for (const property of bindings.keys()) {
    if (new RegExp(`\\bthis\\.${property}\\b`).test(body)) usedStores.add(property);
  }
  if (usedStores.size === 0) return false;

  if (usedStores.size > 1) return true;

  let rest = body;
  for (const property of usedStores) {
    // `store.items()` / `store.loading()` son lecturas de señal: se descartan.
    rest = rest.replace(new RegExp(`this\\.${property}\\.\\w+\\s*\\(\\s*\\)`, 'g'), '');
    // `store.getAverageRating(id)` es una derivación encubierta.
    if (new RegExp(`this\\.${property}\\.\\w+\\s*\\(\\s*[^)\\s]`).test(rest)) return true;
  }

  if (
    /\.(?:filter|map|reduce|reduceRight|sort|slice|find|findIndex|some|every|flatMap|concat|groupBy)\s*\(/.test(
      rest,
    )
  ) {
    return true;
  }

  if (/\bMath\.|\bnew\s+Date\b|\bDate\.parse\b/.test(rest)) return true;
  if (/[+\-*/%](?![=>])/.test(rest.replace(/=>/g, ''))) return true;

  // Llamada a un helper con argumentos, p. ej. `isSellerRole(role)`.
  // Se excluyen las palabras clave de control (`if`, `for`, `return`, …).
  const helper = rest.match(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(\s*[^)\s]/);
  if (!helper) return false;
  return !CONTROL_KEYWORDS.has(helper[1]);
}

/** Hallazgos de R-ST-3: páginas que derivan estado de dominio fuera del store. */
export function findPageDerivationViolations() {
  const findings = [];
  const add = (rel, line, detail, key) => {
    findings.push({ rule: 'R-ST-3', file: rel, line, detail, key: `${rel}|R-ST-3|${key}` });
  };

  for (const file of walkFiles(featuresRoot, (name) => name.endsWith('.component.ts'))) {
    const rel = toRel(file);
    if (isSpec(rel) || !/\/pages\//.test(rel)) continue;

    const masked = maskSource(readText(file));
    const bindings = storeBindings(masked);
    if (bindings.size === 0) continue;

    let index = 0;
    while ((index = masked.indexOf('computed', index)) >= 0) {
      const open = masked.indexOf('(', index);
      if (open < 0) break;
      const close = closingIndex(masked, open);
      if (close < 0) break;

      const name = computedName(masked.slice(Math.max(0, index - 160), index), `computed@${index}`);
      const body = masked.slice(open + 1, close);
      if (isDomainDerivation(body, bindings)) {
        add(
          rel,
          lineAt(masked, index),
          `'${name}' deriva estado de dominio en la página; muévelo a withComputed del store`,
          `computed:${name}`,
        );
      }

      index = close;
    }
  }

  return findings;
}

/**
 * Hallazgos de R-SO-8: componentes presentacionales que conocen un store.
 * Cubre `features/<feature>/components/` y `shared/ui/`.
 */
export function findPresentationalStoreViolations() {
  const findings = [];
  const add = (rel, line, detail, key) => {
    findings.push({ rule: 'R-SO-8', file: rel, line, detail, key: `${rel}|R-SO-8|${key}` });
  };

  const roots = [featuresRoot, sharedUiRoot];
  for (const root of roots) {
    for (const file of walkFiles(root, (name) => name.endsWith('.ts'))) {
      const rel = toRel(file);
      if (isSpec(rel)) continue;
      if (root === featuresRoot && !/\/components\//.test(rel)) continue;

      const src = readText(file);

      for (const { token, line } of extractInjections(src)) {
        if (token.endsWith('Store')) {
          add(
            rel,
            line,
            `componente presentacional inyecta '${token}' (debe recibir input/output)`,
            `inject:${token}`,
          );
        }
      }

      for (const { specifier, line } of extractImports(src)) {
        if (/\/state\//.test(specifier) || /\/state$/.test(specifier)) {
          add(
            rel,
            line,
            `componente presentacional importa estado interno ('${specifier}')`,
            `import:${specifier}`,
          );
        }
      }
    }
  }

  return findings;
}
