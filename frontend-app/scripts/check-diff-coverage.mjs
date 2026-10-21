#!/usr/bin/env node
/**
 * R-COV-5 — cobertura de las líneas cambiadas (diff coverage).
 *
 * Compara las líneas añadidas/modificadas en `src/app` contra el reporte
 * `coverage/frontend-app/lcov.info` y falla si la cobertura de esas líneas baja
 * del mínimo (`DIFF_COVERAGE_MIN`, 80% por defecto). Solo cuenta líneas
 * instrumentadas (las que aparecen en el lcov), así que modelos/plantillas no
 * penalizan.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const LCOV_PATH = 'coverage/frontend-app/lcov.info';
const MIN = Number(process.env.DIFF_COVERAGE_MIN ?? 80);

/** Parsea lcov.info → Map<archivo, Map<línea, hits>>. */
export function parseLcov(text) {
  const files = new Map();
  let current = null;

  for (const line of text.split('\n')) {
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

  for (const line of diff.split('\n')) {
    const header = line.match(/^\+\+\+ b\/(.+)$/);
    if (header) {
      file = header[1];
      continue;
    }
    if (line.startsWith('--- ')) continue;

    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (hunk && file) {
      const start = Number(hunk[1]);
      const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
      if (count === 0) continue;
      const lines = changed.get(file) ?? new Set();
      for (let index = 0; index < count; index += 1) lines.add(start + index);
      changed.set(file, lines);
    }
  }

  return changed;
}

/** Calcula la cobertura de las líneas cambiadas que están instrumentadas. */
export function computeDiffCoverage({ changed, lcov, min }) {
  let total = 0;
  let covered = 0;
  const missing = [];

  for (const [file, lines] of changed) {
    const record = [...lcov.entries()].find(([path]) => path.endsWith(file));
    if (!record) continue;

    for (const line of lines) {
      const hits = record[1].get(line);
      if (hits === undefined) continue;
      total += 1;
      if (hits > 0) covered += 1;
      else missing.push(`${file}:${line}`);
    }
  }

  const percent = total === 0 ? 100 : (covered / total) * 100;
  return { total, covered, percent, missing, pass: percent >= min };
}

function gitDiff(base) {
  try {
    return execFileSync(
      'git',
      ['diff', '--unified=0', '--no-color', `${base}...HEAD`, '--', 'src/app'],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    );
  } catch {
    return '';
  }
}

function main() {
  const base =
    process.env.DIFF_COVERAGE_BASE ??
    (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main');

  if (!existsSync(LCOV_PATH)) {
    console.error(`No se encontró ${LCOV_PATH}. Ejecuta \`npm test -- --watch=false\` antes.`);
    process.exit(1);
  }

  const changed = parseUnifiedDiff(gitDiff(base));
  const lcov = parseLcov(readFileSync(LCOV_PATH, 'utf8'));
  const result = computeDiffCoverage({ changed, lcov, min: MIN });

  if (result.total === 0) {
    console.log('Diff coverage: sin líneas ejecutables cambiadas.');
    return;
  }

  console.log(
    `Diff coverage: ${result.covered}/${result.total} (${result.percent.toFixed(2)}%), mínimo ${MIN}%.`,
  );

  if (!result.pass) {
    console.error(`Líneas cambiadas sin cubrir:\n${result.missing.join('\n')}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
