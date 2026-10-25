#!/usr/bin/env node
/**
 * release-readiness.mjs — detecta si `main` tiene una release pendiente.
 *
 * Es **informativo**: no bloquea el push a `main`. Compara el último tag de
 * release con la versión de `package.json` y con los commits que tocaron el
 * artefacto de la app desde ese tag. Las rutas viven en `config/release.mjs` y
 * el parser semver en `engine/lib/semver.mjs`.
 *
 * Uso:
 *   node scripts/release-readiness.mjs
 *   node scripts/release-readiness.mjs --main-ref origin/main
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { repoRoot } from './engine/lib/paths.mjs';
import { compareSemver, parseTag } from './engine/lib/semver.mjs';
import {
  APP_ARTIFACT_EXCLUDES,
  APP_ARTIFACT_PATTERNS,
  DEFAULT_MAIN_REF,
  DEPENDENCY_ARTIFACT_PATTERNS,
} from './config/release.mjs';

const IMPACT_RANK = { none: 0, patch: 1, minor: 2, major: 3 };

/** ¿El archivo forma parte del artefacto de producción? */
export function isArtifactFile(file) {
  if (APP_ARTIFACT_EXCLUDES.some((pattern) => pattern.test(file))) return false;
  return APP_ARTIFACT_PATTERNS.some((pattern) => pattern.test(file));
}

/** ¿El commit toca el artefacto (o es una actualización de dependencias)? */
export function commitTouchesArtifact(subject, files) {
  if (files.some(isArtifactFile)) return true;
  const touchesDependencies = files.some((file) =>
    DEPENDENCY_ARTIFACT_PATTERNS.some((pattern) => pattern.test(file)),
  );
  return touchesDependencies && /^(build|fix)\(deps\)/.test(subject ?? '');
}

/** Clasifica un commit según Conventional Commits. */
export function classifyCommit(subject, body = '') {
  const match = /^([a-z]+)(?:\([^)]*\))?(!)?: /.exec(subject ?? '');
  if (!match) return 'none';
  if (match[2] === '!' || /(^|\n)BREAKING[ -]CHANGE:/.test(body)) return 'major';

  switch (match[1]) {
    case 'feat':
      return 'minor';
    case 'fix':
    case 'perf':
    case 'refactor':
    case 'build':
      return 'patch';
    default:
      return 'none';
  }
}

/** Mayor impacto semver de una lista. */
export function maxImpact(impacts) {
  return impacts.reduce(
    (max, impact) => (IMPACT_RANK[impact] > IMPACT_RANK[max] ? impact : max),
    'none',
  );
}

/** Siguiente versión semver estable para un impacto. */
export function bumpVersion(version, impact) {
  const parsed = parseTag(`v${version}`);
  if (!parsed) throw new Error(`Versión no semver: '${version}'.`);

  const next = { ...parsed, prerelease: [] };
  if (impact === 'major') {
    next.major += 1;
    next.minor = 0;
    next.patch = 0;
  } else if (impact === 'minor') {
    next.minor += 1;
    next.patch = 0;
  } else if (impact === 'patch') {
    next.patch += 1;
  }
  return `v${next.major}.${next.minor}.${next.patch}`;
}

/**
 * Calcula el estado de release.
 * @param {object} input
 * @param {string | null} input.lastTag Último tag semver en main.
 * @param {string} input.packageVersion Versión actual de package.json.
 * @param {Array<{subject: string, body?: string}>} input.artifactCommits
 *   Commits desde el último tag que tocan el artefacto de la app.
 * @param {boolean} [input.packageTagOnMain] Existe `v<packageVersion>` y está en main.
 */
export function buildReadiness({
  lastTag,
  packageVersion,
  artifactCommits,
  packageTagOnMain = false,
}) {
  const impact = maxImpact(
    artifactCommits.map((commit) => classifyCommit(commit.subject, commit.body)),
  );
  const current = parseTag(`v${packageVersion}`);
  const last = parseTag(lastTag ?? 'v0.0.0');
  if (!current || !last) throw new Error('No se pudo interpretar la versión o el último tag.');

  if (impact === 'none') {
    if (lastTag && compareSemver(current, last) > 0) {
      return {
        status: 'version-ahead',
        impact,
        lastTag,
        packageVersion,
        expectedTag: `v${packageVersion}`,
        artifactCommits,
      };
    }
    return {
      status: 'up-to-date',
      impact,
      lastTag,
      packageVersion,
      expectedTag: lastTag,
      artifactCommits,
    };
  }

  const expectedTag = bumpVersion(lastTag ? lastTag.slice(1) : '0.0.0', impact);

  if (compareSemver(current, last) <= 0) {
    return {
      status: 'release-pending',
      impact,
      lastTag,
      packageVersion,
      expectedTag,
      artifactCommits,
    };
  }

  return {
    status: packageTagOnMain ? 'released' : 'tag-pending',
    impact,
    lastTag,
    packageVersion,
    expectedTag: `v${packageVersion}`,
    artifactCommits,
  };
}

function git(args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    if (allowFailure) return null;
    const detail = error.stderr?.toString().trim();
    throw new Error(`git ${args.join(' ')} falló${detail ? `: ${detail}` : ''}`, {
      cause: error,
    });
  }
}

function parseLog(raw) {
  return (raw ?? '')
    .split('\u001e')
    .map((chunk) => chunk.replace(/^\n/, '').trimEnd())
    .filter(Boolean)
    .map((chunk) => {
      const [sha = '', subject = '', body = ''] = chunk.split('\u0000');
      return { sha: sha.trim(), subject: subject.trim(), body: body.trim() };
    });
}

function lastReleaseTag(mainRef) {
  const tags = git(['tag', '--merged', mainRef, '--list', 'v*.*.*'])
    .split('\n')
    .filter(Boolean)
    .map((tag) => ({ tag, parsed: parseTag(tag) }))
    .filter((entry) => entry.parsed)
    .sort((a, b) => compareSemver(a.parsed, b.parsed));
  return tags.at(-1)?.tag ?? null;
}

function tagOnMain(tag, mainRef) {
  if (git(['rev-parse', '--verify', `refs/tags/${tag}`], { allowFailure: true }) === null) {
    return false;
  }
  return (
    git(['merge-base', '--is-ancestor', `refs/tags/${tag}`, mainRef], { allowFailure: true }) !==
    null
  );
}

/** Ejecuta la comprobación contra el repo real y devuelve el resultado. */
export function inspectReleaseReadiness({ mainRef = DEFAULT_MAIN_REF } = {}) {
  const lastTag = lastReleaseTag(mainRef);
  const packageVersion = JSON.parse(
    readFileSync(`${repoRoot}/frontend-app/package.json`, 'utf8'),
  ).version;
  const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
  const commits = parseLog(git(['log', range, '--no-merges', '--format=%H%x00%s%x00%b%x1e']));

  const artifactCommits = commits.filter((commit) => {
    const files = git([
      'diff-tree',
      '--no-commit-id',
      '--name-only',
      '-r',
      '--no-renames',
      commit.sha,
    ])
      .split('\n')
      .filter(Boolean);
    return commitTouchesArtifact(commit.subject, files);
  });

  return buildReadiness({
    lastTag,
    packageVersion,
    artifactCommits,
    packageTagOnMain: tagOnMain(`v${packageVersion}`, mainRef),
  });
}

function print(result) {
  const labels = {
    'up-to-date': 'Al día: no hay cambios de artefacto pendientes.',
    'release-pending': `Release pendiente: prepara ${result.expectedTag}.`,
    'tag-pending': `Tag pendiente: crea ${result.expectedTag} sobre main.`,
    'version-ahead': `Versión adelantada sin cambios de artefacto: falta ${result.expectedTag}.`,
    released: `Release publicada: ${result.expectedTag}.`,
  };
  const label = labels[result.status] ?? result.status;

  console.log(`Último tag: ${result.lastTag ?? '(ninguno)'}`);
  console.log(`Versión actual: ${result.packageVersion}`);
  console.log(`Impacto semver: ${result.impact}`);
  console.log(`Estado: ${label}`);
  if (result.artifactCommits.length > 0) {
    console.log('Commits de artefacto desde el último tag:');
    for (const commit of result.artifactCommits) console.log(`- ${commit.subject}`);
  }

  if (['release-pending', 'tag-pending', 'version-ahead'].includes(result.status)) {
    console.log(`::warning::${label}`);
  }
}

function parseArgs(argv) {
  let mainRef = DEFAULT_MAIN_REF;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--main-ref') mainRef = argv[++i];
    else if (arg.startsWith('--main-ref=')) mainRef = arg.slice('--main-ref='.length);
    else throw new Error(`Argumento no reconocido: ${arg}`);
  }
  return { mainRef };
}

function main() {
  const { mainRef } = parseArgs(process.argv.slice(2));
  print(inspectReleaseReadiness({ mainRef }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}
