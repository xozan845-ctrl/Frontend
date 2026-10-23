/**
 * Guarda estática de R-PF-4: llamadas a métodos propios del componente en
 * interpolaciones y bindings de propiedad. Esas llamadas se reevalúan en cada
 * ciclo de detección; el cálculo debe vivir en un `computed`, un pipe o un VM.
 *
 * Quedan fuera los eventos, los bindings de clase/estilo y `routerLink` porque
 * suelen ser mapeos baratos de presentación. El alcance verificado es el
 * formateo/cálculo repetido que produce texto o valores.
 */
import { existsSync } from 'node:fs';
import { relative, sep } from 'node:path';
import { appRoot, resolveInApp } from '../../engine/lib/paths.mjs';
import { readText, walkFiles } from '../../engine/lib/fs.mjs';
import { lineAt, maskSource } from '../../engine/lib/source.mjs';

const srcRoot = resolveInApp('src/app');
const toRel = (path) => relative(appRoot, path).split(sep).join('/');
const isSpec = (rel) => rel.endsWith('.spec.ts');

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

/** Métodos declarados en la clase del componente (no señales ni imports). */
function declaredMethods(src) {
  const masked = maskSource(src);
  const methods = new Set();

  const methodRe =
    /(?:^|\n)\s*(?:(?:public|private|protected|readonly|async|static)\s+)*([A-Za-z_$][\w$]*)\s*(?:<[^>]*>)?\s*\([^)]*\)\s*(?::[^={;]+)?\{/g;
  let match;
  while ((match = methodRe.exec(masked))) {
    if (!CONTROL_KEYWORDS.has(match[1])) methods.add(match[1]);
  }

  const arrowRe =
    /(?:^|\n)\s*(?:(?:public|private|protected|readonly)\s+)*([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;
  while ((match = arrowRe.exec(masked))) methods.add(match[1]);

  return methods;
}

/** Expresiones de plantilla que producen texto o valores (no eventos). */
function templateExpressions(html) {
  const expressions = [];

  for (const match of html.matchAll(/\{\{([\s\S]*?)\}\}/g)) {
    expressions.push({ value: match[1], index: match.index, kind: 'interpolación' });
  }

  const bindingRe = /\[(?!style[.\]]|class[.\]]|ngClass|ngStyle|routerLink)([^\]]+)\]="([^"]*)"/g;
  for (const match of html.matchAll(bindingRe)) {
    expressions.push({
      value: match[2],
      index: match.index,
      kind: `binding [${match[1]}]`,
    });
  }

  return expressions;
}

/** Hallazgos de R-PF-4: métodos del componente invocados desde la plantilla. */
export function findTemplateFunctionViolations() {
  const findings = [];
  const seen = new Set();

  for (const htmlFile of walkFiles(srcRoot, (name) => name.endsWith('.component.html'))) {
    const rel = toRel(htmlFile);
    const tsFile = htmlFile.replace(/\.html$/, '.ts');
    if (!existsSync(tsFile)) continue;

    const methods = declaredMethods(readText(tsFile));
    if (methods.size === 0) continue;

    const html = readText(htmlFile);
    for (const expression of templateExpressions(html)) {
      for (const call of expression.value.matchAll(
        /(?<![.\w$])(?:this\.)?([A-Za-z_$][\w$]*)\s*\(([^()]*)\)/g,
      )) {
        const name = call[1];
        if (!call[2].trim() || !methods.has(name) || CONTROL_KEYWORDS.has(name)) continue;

        const key = `${rel}|R-PF-4|${name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          rule: 'R-PF-4',
          file: rel,
          line: lineAt(html, expression.index),
          detail: `'${name}()' se evalúa en ${expression.kind}; usa computed, pipe o un VM`,
          key,
        });
      }
    }
  }

  return findings;
}
