/**
 * Genera `public/version.json` antes de build/start con:
 * - versión de `package.json` (no se edita el modal a mano);
 * - cambios user-facing desde el último tag, leídos de los commits de Git.
 *
 * El archivo está ignorado por Git: se regenera en cada build y el service
 * worker lo consulta sin caché al detectar una actualización.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const MAX_CHANGES = 6;
const TYPE_LABELS = {
  feat: 'Nuevo',
  fix: 'Corregido',
  perf: 'Rendimiento',
  refactor: 'Mejora',
};

const readVersion = () => JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

const lastTag = () => {
  try {
    return git(['describe', '--tags', '--abbrev=0']);
  } catch {
    return null;
  }
};

const recentSubjects = () => {
  try {
    const tag = lastTag();
    const range = tag ? `${tag}..HEAD` : '-10';
    return git(['log', range, '--pretty=%s']).split('\n').filter(Boolean);
  } catch {
    return [];
  }
};

const formatChange = (subject) => {
  const match = subject.match(/^(\w+)(?:\([^)]+\))?!?:\s*(.+)$/);
  if (!match) return null;

  const [, type, rawText] = match;
  const label = TYPE_LABELS[type];
  if (!label) return null;

  const text = rawText.replace(/\s*\((?:R|ADR)-[A-Z0-9-]+(?:\/[A-Z0-9-]+)*\)\s*$/i, '').trim();
  return text ? `${label}: ${text}` : null;
};

const changes = recentSubjects().map(formatChange).filter(Boolean);
const packageVersion = readVersion();
const version = process.env.APP_VERSION?.trim() || packageVersion;
const payload = {
  version,
  changes: changes.slice(0, MAX_CHANGES),
  totalChanges: changes.length,
};

writeFileSync(join(root, 'public/version.json'), `${JSON.stringify(payload, null, 2)}\n`);
console.log(
  `version.json: v${version} (${payload.changes.length}/${payload.totalChanges} cambios visibles)`,
);
