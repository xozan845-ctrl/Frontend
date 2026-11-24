#!/usr/bin/env node
/**
 * R-COV-5 — cobertura de las líneas cambiadas (diff coverage).
 *
 * Compara las líneas añadidas/modificadas en `src/app` contra el reporte
 * `coverage/frontend-app/lcov.info` y falla si la cobertura de esas líneas baja
 * del mínimo (`DIFF_COVERAGE_MIN`, 80% por defecto). Solo cuenta líneas
 * instrumentadas (las que aparecen en el lcov), así que modelos/plantillas no
 * penalizan.
 *
 * Las rutas del lcov y del diff se canonizan contra `root` (la raíz del
 * proyecto Angular). Así `src/app/…`, `frontend-app/src/app/…`,
 * `./src/app/…`, separadores Windows y rutas absolutas representan el mismo
 * archivo sin comparar por sufijos ni por nombre base.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { posix, win32 } from 'node:path';
import { pathToFileURL } from 'node:url';
import { appRoot } from '../engine/lib/paths.mjs';

const LCOV_PATH = 'coverage/frontend-app/lcov.info';
const MIN = Number(process.env.DIFF_COVERAGE_MIN ?? 80);

function toPosix(value) {
  return value.replace(/\\/g, '/');
}

function isWindowsAbsolute(value) {
  return /^[A-Za-z]:[\\/]/.test(value);
}

/**
 * Normaliza una ruta de lcov o de diff a una clave relativa a `root`.
 *
 * Acepta rutas relativas (con `./` o separadores Windows), rutas ya
 * prefijadas por el nombre del proyecto (`frontend-app/src/app/…`) y rutas
 * absolutas POSIX o Windows. Devuelve `''` para una entrada vacía.
 */
export function canonicalCoveragePath(file, { root = appRoot } = {}) {
  const value = String(file ?? '').trim();
  if (!value) return '';

  let normalized;
  if (value.startsWith('/') || isWindowsAbsolute(value)) {
    const relativePath =
      isWindowsAbsolute(value) || isWindowsAbsolute(root)
        ? win32.relative(root, value)
        : posix.relative(toPosix(root), toPosix(value));
    normalized = toPosix(relativePath);
  } else {
    normalized = toPosix(posix.normalize(toPosix(value)));
  }

  normalized = posix.normalize(normalized).replace(/^\.\//, '');
  if (normalized === '.' || normalized === '..' || normalized.startsWith('../')) return normalized;

  const projectName = posix.basename(toPosix(root).replace(/\/+$/, ''));
  if (normalized === projectName) return '';
  if (normalized.startsWith(`${projectName}/`)) {
    normalized = normalized.slice(projectName.length + 1);
  }
  return normalized;
}

/**
 * Rutas que instrumenta la cobertura, espejo de `coverageInclude` y
 * `coverageExclude` de `angular.json`. El resto (componentes, modelos,
 * plantillas, HTML) no aparece en el lcov: no penaliza ni obliga a generarlo.
 */
const INSTRUMENTED = [
  /^src\/app\/features\/(?:.+\/)?(?:adapters|guards|interceptors|repositories|services|state)\/.+\.ts$/,
  /^src\/app\/core\/services\/.+\.ts$/,
];
const NOT_INSTRUMENTED = [/\.spec\.ts$/, /^src\/app\/.+\/mocks\/.+\.ts$/];

/** Indica si una ruta del diff puede aparecer en el lcov. */
export function isInstrumentedPath(file, { root = appRoot } = {}) {
  const key = canonicalCoveragePath(file, { root });
  if (!key) return false;
  if (NOT_INSTRUMENTED.some((pattern) => pattern.test(key))) return false;
  return INSTRUMENTED.some((pattern) => pattern.test(key));
}

/** Parsea lcov.info → Map<archivo, Map<línea, hits>>. */
export function parseLcov(text) {
  const files = new Map();
  let current = null;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (line.startsWith('SF:')) {
      current = line.slice(3).trim();
      files.set(current, new Map());
      continue;
    }
    if (line.startsWith('DA:') && current) {
      const [number, hits] = line.slice(3).split(',');
      files.get(current).set(Number(number), Number(hits));
      continue;
    }
    if (line === 'end_of_record') current = null;
  }

  return files;
}

/** Parsea `git diff --unified=0` → Map<archivo, Set<línea nueva>>. */
export function parseUnifiedDiff(diff) {
  const changed = new Map();
  let file = null;
  let inHunk = false;
  let newLine = 0;

  for (const rawLine of diff.split('\n')) {
    const line = rawLine.replace(/\r$/, '');

    if (line.startsWith('diff --git ')) {
      file = null;
      inHunk = false;
      continue;
    }

    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (hunk && file) {
      newLine = Number(hunk[1]);
      inHunk = true;
      continue;
    }

    if (!inHunk) {
      if (line.startsWith('+++ ')) {
        const target = line.slice(4);
        file = target === '/dev/null' ? null : target.replace(/^b\//, '');
      }
      continue;
    }

    // Dentro del hunk las líneas `+++`/`---` son contenido, no cabeceras.
    if (line.startsWith('\\')) continue;
    if (line.startsWith('+')) {
      if (file) {
        const lines = changed.get(file) ?? new Set();
        lines.add(newLine);
        changed.set(file, lines);
      }
      newLine += 1;
      continue;
    }
    if (line.startsWith(' ')) newLine += 1;
  }

  return changed;
}

/** Calcula la cobertura de las líneas cambiadas que están instrumentadas. */
export function computeDiffCoverage({ changed, lcov, min, root = appRoot }) {
  let total = 0;
  let covered = 0;
  const missing = [];

  const records = new Map();
  for (const [file, lines] of lcov) {
    const key = canonicalCoveragePath(file, { root });
    const record = records.get(key) ?? new Map();
    for (const [line, hits] of lines) record.set(line, hits);
    records.set(key, record);
  }

  for (const [file, lines] of changed) {
    const key = canonicalCoveragePath(file, { root });
    const record = records.get(key);
    if (!record) continue;

    for (const line of lines) {
      const hits = record.get(line);
      if (hits === undefined) continue;
      total += 1;
      if (hits > 0) covered += 1;
      else missing.push(`${key}:${line}`);
    }
  }

  const percent = total === 0 ? 100 : (covered / total) * 100;
  return { total, covered, percent, missing, pass: percent >= min };
}

/**
 * Ejecuta `git diff` con cwd explícito y `diff.relative=false` para que las
 * rutas no dependan de la configuración del usuario. Devuelve `{ ok, diff }` o
 * `{ ok: false, error }`; un diff vacío es un éxito con `diff: ''`.
 */
export function gitDiff(base, { cwd = appRoot } = {}) {
  try {
    const diff = execFileSync(
      'git',
      [
        '-c',
        'diff.relative=false',
        '-c',
        'core.quotePath=false',
        'diff',
        '--unified=0',
        '--no-color',
        '--no-ext-diff',
        `${base}...HEAD`,
        '--',
        'src/app',
      ],
      {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    return { ok: true, diff };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Evalúa el diff contra el lcov. Devuelve el código de salida y los mensajes
 * para que `main` (y los autotests) distingan diff vacío de error de Git.
 */
export function evaluateCoverage({
  base = 'origin/main',
  min = MIN,
  cwd = appRoot,
  root = appRoot,
  lcovPath = LCOV_PATH,
  git = gitDiff,
  exists = existsSync,
  read = readFileSync,
} = {}) {
  const diff = git(base, { cwd });
  if (!diff.ok) {
    return {
      code: 1,
      error: `No se pudo obtener el diff de Git (${base}): ${diff.error}`,
    };
  }

  const changed = parseUnifiedDiff(diff.diff);
  if (changed.size === 0) {
    return { code: 0, message: 'Diff coverage: sin líneas ejecutables cambiadas.' };
  }

  if (!exists(lcovPath)) {
    const instrumented = [...changed.keys()].filter((file) => isInstrumentedPath(file, { root }));
    if (instrumented.length === 0) {
      return {
        code: 0,
        message: 'Diff coverage: sin líneas instrumentadas cambiadas (lcov no requerido).',
      };
    }
    return {
      code: 1,
      error: `No se encontró ${lcovPath}. Ejecuta \`npm test -- --watch=false\` antes.`,
    };
  }

  const lcov = parseLcov(read(lcovPath, 'utf8'));
  const result = computeDiffCoverage({ changed, lcov, min, root });

  if (result.total === 0) {
    return { code: 0, message: 'Diff coverage: sin líneas ejecutables cambiadas.', result };
  }

  const message = `Diff coverage: ${result.covered}/${result.total} (${result.percent.toFixed(2)}%), mínimo ${min}%.`;
  if (!result.pass) {
    return {
      code: 1,
      message,
      error: `Líneas cambiadas sin cubrir:\n${result.missing.join('\n')}`,
      result,
    };
  }
  return { code: 0, message, result };
}

function main() {
  const base =
    process.env.DIFF_COVERAGE_BASE ??
    (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main');

  const outcome = evaluateCoverage({ base, min: MIN });
  if (outcome.message) console.log(outcome.message);
  if (outcome.error) console.error(outcome.error);
  process.exitCode = outcome.code;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
