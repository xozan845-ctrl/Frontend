/**
 * Guardas de adopción del sistema Glass (R-UX-8).
 *
 * Una superficie principal no puede usar un fondo crudo si no declara una
 * utilidad Glass o un primitivo global. El ratchet solo falla en las raíces
 * adoptadas; el backlog pendiente se mide y no puede crecer.
 */
import { relative, sep } from 'node:path';
import { GLASS_ADOPTION_ADOPTED } from '../../config/project.mjs';
import { readText, walkFiles } from '../../engine/lib/fs.mjs';
import { resolveInApp } from '../../engine/lib/paths.mjs';
import { lineAt } from '../../engine/lib/source.mjs';
import { baseTokens, classVariants, isGlassUtilityClass } from './visual-checks.mjs';

const adoptionRoot = resolveInApp('src/app');
const toRel = (path) => relative(adoptionRoot, path).split(sep).join('/');
const STRING_LITERAL = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;

/** Fondos de superficie principal; la baja opacidad (5/10/20) queda fuera. */
export const RAW_SURFACE =
  /^(?:bg-white|bg-slate-(?:50|100|200)|bg-gray-(?:50|100)|bg-surface-(?:50|100|200|300)|bg-accent-50|bg-(?:red|emerald|amber|blue|violet)-(?:50|100))(?:\/(?:[3-9]\d|100))?$/;

/** Clases que declaran una superficie adoptada. */
export const ADOPTED_SURFACE =
  /^(?:glass(?:-[a-z0-9-]+)?|card(?:-[a-z0-9-]+)?|btn(?:-[a-z0-9-]+)?|input|badge(?:-[a-z0-9-]+)?|icon-btn|alert(?:-[a-z0-9-]+)?)$/;

export const hasRawSurface = (classes) =>
  baseTokens(classes).some((token) => RAW_SURFACE.test(token));

export const hasAdoptedSurface = (classes) =>
  isGlassUtilityClass(classes) || baseTokens(classes).some((token) => ADOPTED_SURFACE.test(token));

const isFileAdopted = (rel) =>
  GLASS_ADOPTION_ADOPTED.some((root) => rel === root || rel.startsWith(`${root}/`));

const areaOf = (rel) => {
  const parts = rel.split('/');
  if (parts[0] === 'features') return parts.slice(0, 3).join('/');
  return parts.slice(0, 2).join('/');
};

const finding = (file, line, classes) => ({
  rule: 'R-UX-8',
  file,
  line,
  detail: `superficie cruda sin Glass/primitivo: ${classes.trim().slice(0, 100)}`,
  key: `${file}|R-UX-8|surface:${classes.trim().slice(0, 100)}`,
});

const classListsFromMarkup = (source) => {
  const lists = [];
  for (const tag of source.matchAll(/<[a-z][^>]*>/gi)) {
    for (const classes of classVariants(tag[0])) lists.push({ classes, index: tag.index });
  }
  return lists;
};

const classListsFromTs = (source) => {
  const lists = [];
  for (const literal of source.matchAll(STRING_LITERAL)) {
    const value = literal[2];
    if (!value.includes('bg-')) continue;

    const tags = [...value.matchAll(/<[a-z][^>]*>/gi)];
    if (tags.length === 0) {
      lists.push({ classes: value, index: literal.index });
      continue;
    }

    for (const tag of tags) {
      for (const classes of classVariants(tag[0])) lists.push({ classes, index: literal.index });
    }
  }
  return lists;
};

export const scanGlassSurfaceFile = (file) => {
  const rel = toRel(file);
  const source = readText(file);
  const lists = file.endsWith('.html') ? classListsFromMarkup(source) : classListsFromTs(source);
  const violations = [];

  for (const { classes, index } of lists) {
    if (!hasRawSurface(classes) || hasAdoptedSurface(classes)) continue;
    violations.push({ rel, line: lineAt(source, index), classes });
  }

  return { rel, violations };
};

const isPresentationPath = (rel) =>
  rel.startsWith('layout/') || rel.startsWith('shared/ui/') || /\/(pages|components)\//.test(rel);

const sourceFiles = () => [
  ...walkFiles(adoptionRoot, (name) => name.endsWith('.html')),
  ...walkFiles(adoptionRoot, (name) => name.endsWith('.ts') && !name.endsWith('.spec.ts')).filter(
    (file) => isPresentationPath(toRel(file)),
  ),
];

/** Hallazgos solo en las raíces ya adoptadas (ratchet). */
export function findGlassAdoptionViolations() {
  const findings = [];
  const seen = new Set();

  for (const file of sourceFiles()) {
    const { rel, violations } = scanGlassSurfaceFile(file);
    if (!isFileAdopted(rel)) continue;

    for (const violation of violations) {
      const item = finding(violation.rel, violation.line, violation.classes);
      if (seen.has(item.key)) continue;
      seen.add(item.key);
      findings.push(item);
    }
  }

  return findings;
}

/** Backlog de superficies pendientes fuera de las raíces adoptadas. */
export function getGlassAdoptionBacklog() {
  const byArea = new Map();
  const pendingFiles = new Set();
  let pending = 0;

  for (const file of sourceFiles()) {
    const { rel, violations } = scanGlassSurfaceFile(file);
    if (isFileAdopted(rel) || violations.length === 0) continue;

    pendingFiles.add(rel);
    pending += violations.length;
    const area = areaOf(rel);
    byArea.set(area, (byArea.get(area) ?? 0) + violations.length);
  }

  return {
    pending,
    files: pendingFiles.size,
    byArea: [...byArea].sort((a, b) => b[1] - a[1]),
    adoptedRoots: GLASS_ADOPTION_ADOPTED.length,
  };
}
