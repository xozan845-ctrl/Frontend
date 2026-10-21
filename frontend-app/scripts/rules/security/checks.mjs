/**
 * Guardas estáticas de seguridad (R-SE-3/4/7/9). Análisis ligero sobre fuentes
 * enmascaradas (sin comentarios ni strings) y HTML sin comentarios.
 */
import { existsSync } from 'node:fs';
import { relative, sep } from 'node:path';
import { appRoot, resolveInApp, resolveInRepo } from '../../engine/lib/paths.mjs';
import { readText, walkFiles } from '../../engine/lib/fs.mjs';
import { lineAt, maskSource } from '../../engine/lib/source.mjs';

const srcRoot = resolveInApp('src/app');
const toRel = (path) => relative(appRoot, path).split(sep).join('/');

const listTs = () =>
  walkFiles(srcRoot, (name) => name.endsWith('.ts') && !name.endsWith('.spec.ts'));
const listHtml = () => walkFiles(srcRoot, (name) => name.endsWith('.html'));
const stripHtmlComments = (source) =>
  source.replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ' '));

const finding = (rule, file, line, detail, suffix = '') => ({
  rule,
  file,
  line,
  detail,
  key: `${file}|${rule}|${suffix || detail}`,
});

/** Hallazgos de R-SE-3/4/7/9. */
export function findSecurityViolations() {
  const findings = [];

  for (const file of listTs()) {
    const rel = toRel(file);
    const masked = maskSource(readText(file));

    for (const match of masked.matchAll(/bypassSecurityTrust[A-Za-z]*\s*\(|\binnerHTML\b/g)) {
      findings.push(
        finding('R-SE-3', rel, lineAt(masked, match.index), 'usa bypassSecurityTrust/innerHTML'),
      );
    }
    for (const match of masked.matchAll(/console\.log\s*\(/g)) {
      findings.push(finding('R-SE-4', rel, lineAt(masked, match.index), 'console.log en src/app'));
    }
  }

  for (const file of listHtml()) {
    const rel = toRel(file);
    const html = stripHtmlComments(readText(file));

    for (const match of html.matchAll(/\binnerHTML\b/g)) {
      findings.push(
        finding('R-SE-3', rel, lineAt(html, match.index), 'usa innerHTML en plantilla'),
      );
    }
    for (const match of html.matchAll(/<a\b[^>]*>/g)) {
      const tag = match[0];
      if (/target\s*=\s*"_blank"/.test(tag) && !/rel\s*=\s*"[^"]*noopener/.test(tag)) {
        findings.push(
          finding(
            'R-SE-7',
            rel,
            lineAt(html, match.index),
            'enlace target="_blank" sin rel="noopener noreferrer"',
          ),
        );
      }
    }
  }

  const cspTargets = [
    { file: resolveInApp('src/index.html'), label: 'index.html' },
    { file: resolveInApp('firebase.json'), label: 'firebase.json' },
    { file: resolveInRepo('nginx.conf'), label: 'nginx.conf' },
  ];
  for (const target of cspTargets) {
    if (!existsSync(target.file) || !readText(target.file).includes('Content-Security-Policy')) {
      findings.push(finding('R-SE-9', toRel(target.file), 0, `falta CSP en ${target.label}`));
    }
  }

  return findings;
}
