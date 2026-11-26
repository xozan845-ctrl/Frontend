import { createHash } from 'node:crypto';
import { cpSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertGates } from '../config/promotion.mjs';

export const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));

function inventory(root, dir = root) {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const path = join(dir, name);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) throw new Error('El artefacto no admite enlaces simbólicos.');
      if (stat.isDirectory()) return inventory(root, path);
      if (!stat.isFile()) throw new Error(`Archivo no regular: ${path}`);
      return [
        { path: relative(root, path).replaceAll('\\', '/'), sha256: digest(readFileSync(path)) },
      ];
    });
}

export function packArtifact({ source, destination, sha, repository, runId, runAttempt, version }) {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Se exige el SHA completo del build.');
  mkdirSync(destination, { recursive: true });
  cpSync(source, join(destination, 'browser'), {
    recursive: true,
    errorOnExist: true,
    force: false,
  });
  const browser = join(destination, 'browser');
  const runtime = json(join(browser, 'config.json'));
  const appVersion = json(join(browser, 'version.json')).version;
  const files = inventory(browser);
  const apiVersion = (url) => url?.match(/\/api\/(v[0-9]+)(?:\/|$)/)?.[1] ?? null;
  const manifest = {
    schemaVersion: 1,
    sha,
    repository,
    runId: String(runId),
    runAttempt: String(runAttempt),
    version,
    appVersion,
    // Versiones del contrato configurado; no afirman la versión del backend desplegado.
    apiVersions: { core: apiVersion(runtime.apiUrl), ai: apiVersion(runtime.aiScraperUrl) },
    files,
    contentSha256: digest(JSON.stringify(files)),
  };
  writeFileSync(join(destination, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return verifyArtifact(destination, manifest);
}

export function verifyArtifact(directory, expected = {}) {
  const manifest = json(join(directory, 'manifest.json'));
  if (manifest.schemaVersion !== 1) throw new Error('Esquema de artefacto desconocido.');
  for (const key of ['sha', 'repository', 'runId', 'runAttempt', 'version']) {
    if (expected[key] !== undefined && String(manifest[key]) !== String(expected[key])) {
      throw new Error(`Identidad del artefacto incorrecta: ${key}.`);
    }
  }
  const files = inventory(join(directory, 'browser'));
  if (
    JSON.stringify(files) !== JSON.stringify(manifest.files) ||
    digest(JSON.stringify(files)) !== manifest.contentSha256
  ) {
    throw new Error('SHA-256 del contenido no coincide con el artefacto validado.');
  }
  for (const required of [
    'index.html',
    'config.json',
    'version.json',
    'ngsw.json',
    'invitacion.html',
  ]) {
    if (!files.some((file) => file.path === required)) throw new Error(`Falta ${required}.`);
  }
  if (json(join(directory, 'browser/version.json')).version !== manifest.appVersion) {
    throw new Error('La versión visible no coincide con el manifiesto.');
  }
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [command, directory = '.ci-artifact'] = process.argv.slice(2);
  if (command === 'pack') {
    packArtifact({
      source: 'dist/frontend-app/browser',
      destination: directory,
      sha: process.env.GITHUB_SHA,
      repository: process.env.GITHUB_REPOSITORY,
      runId: process.env.GITHUB_RUN_ID,
      runAttempt: process.env.GITHUB_RUN_ATTEMPT,
      version: json('package.json').version,
    });
  } else if (command === 'verify' || command === 'seal') {
    if (command === 'seal') assertGates(JSON.parse(process.env.CI_NEEDS));
    const manifest = verifyArtifact(directory, {
      sha: process.env.SOURCE_SHA ?? process.env.GITHUB_SHA,
      repository: process.env.GITHUB_REPOSITORY,
      runId: process.env.CI_RUN_ID ?? process.env.GITHUB_RUN_ID,
      runAttempt: process.env.CI_RUN_ATTEMPT ?? process.env.GITHUB_RUN_ATTEMPT,
      version: process.env.RELEASE_VERSION,
    });
    console.log(
      JSON.stringify(
        {
          sha: manifest.sha,
          contentSha256: manifest.contentSha256,
          version: manifest.version,
          appVersion: manifest.appVersion,
          files: manifest.files.length,
          runId: manifest.runId,
          runAttempt: manifest.runAttempt,
          apiVersions: manifest.apiVersions,
        },
        null,
        2,
      ),
    );
  } else throw new Error('Uso: artifact.mjs pack|verify|seal [directorio]');
}
