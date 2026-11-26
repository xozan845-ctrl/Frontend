import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { artifactName, assertJobs, assertTrustedRun } from '../config/promotion.mjs';
import { digest, verifyArtifact } from './artifact.mjs';

export async function selectArtifact({ api, repository, runId, sha }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('Repositorio inválido.');
  const base = `/repos/${repository}/actions`;
  const workflow = await api(`${base}/workflows/ci.yml`);
  if (!runId) {
    if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Falta el SHA completo.');
    const runs = await api(
      `${base}/workflows/ci.yml/runs?event=push&branch=main&status=success&head_sha=${sha}&per_page=100`,
    );
    runId = runs.workflow_runs[0]?.id;
  }
  if (!/^[1-9][0-9]*$/.test(String(runId))) throw new Error('Falta un run de CI validado.');
  const run = await api(`${base}/runs/${runId}`);
  assertTrustedRun(run, { repository, workflowId: workflow.id, sha });
  const jobs = [];
  for (let page = 1; ; page += 1) {
    const result = await api(`${base}/runs/${runId}/jobs?filter=latest&per_page=100&page=${page}`);
    jobs.push(...result.jobs);
    if (jobs.length >= result.total_count) break;
  }
  assertJobs(jobs);
  const artifacts = [];
  for (let page = 1; ; page += 1) {
    const result = await api(`${base}/runs/${runId}/artifacts?per_page=100&page=${page}`);
    artifacts.push(...result.artifacts);
    if (artifacts.length >= result.total_count) break;
  }
  const matches = artifacts.filter((entry) => entry.name === artifactName(run.id, run.run_attempt));
  const artifact = matches[0];
  if (matches.length !== 1 || artifact.expired || !/^sha256:[a-f0-9]{64}$/.test(artifact.digest)) {
    throw new Error('Artefacto validado ausente, expirado, ambiguo o sin digest verificable.');
  }
  if (artifact.workflow_run?.id !== run.id || artifact.workflow_run?.head_sha !== run.head_sha) {
    throw new Error('El artefacto pertenece a otro run/SHA.');
  }
  return { run, artifact };
}

// El destino solo recibe un paquete ya verificado. Se puede sustituir por un doble.
export async function promoteVerifiedArtifact({ directory, expected, publish, smoke }) {
  const manifest = verifyArtifact(directory, expected);
  const publication = await publish(manifest);
  await smoke(manifest);
  return {
    status: 'deployed',
    ...publication,
    sha: manifest.sha,
    contentSha256: manifest.contentSha256,
  };
}

async function main() {
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GH_TOKEN;
  if (!token) throw new Error('Falta GH_TOKEN de solo lectura.');
  const api = async (path, binary = false) => {
    const response = await fetch(
      `${process.env.GITHUB_API_URL ?? 'https://api.github.com'}${path}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: AbortSignal.timeout(60_000),
      },
    );
    if (!response.ok) throw new Error(`GitHub API ${response.status}: ${path}`);
    return binary ? Buffer.from(await response.arrayBuffer()) : response.json();
  };
  const { run, artifact } = await selectArtifact({
    api,
    repository,
    runId: process.env.CI_RUN_ID,
    sha: process.env.SOURCE_SHA,
  });
  const archive = await api(`/repos/${repository}/actions/artifacts/${artifact.id}/zip`, true);
  if (`sha256:${digest(archive)}` !== artifact.digest)
    throw new Error('Digest del archivo descargado incorrecto.');
  const temporary = mkdtempSync(join(tmpdir(), 'validated-artifact-'));
  const directory = resolve('.ci-artifact');
  mkdirSync(directory, { recursive: false });
  try {
    const zip = join(temporary, 'artifact.zip');
    writeFileSync(zip, archive);
    execFileSync('unzip', ['-q', zip, '-d', directory]);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
  const manifest = verifyArtifact(directory, {
    sha: run.head_sha,
    repository,
    runId: run.id,
    runAttempt: run.run_attempt,
    version: process.env.RELEASE_VERSION,
  });
  const provenance = {
    sha: run.head_sha,
    ci_run_id: run.id,
    ci_run_attempt: run.run_attempt,
    artifact_id: artifact.id,
    archive_digest: artifact.digest,
    content_sha256: manifest.contentSha256,
    version: manifest.version,
    app_version: manifest.appVersion,
    api_versions: manifest.apiVersions,
  };
  writeFileSync('promotion.json', `${JSON.stringify(provenance, null, 2)}\n`);
  if (process.env.GITHUB_OUTPUT) {
    for (const key of ['sha', 'ci_run_id', 'ci_run_attempt', 'artifact_id', 'content_sha256']) {
      appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${provenance[key]}\n`);
    }
  }
  console.log(JSON.stringify(provenance, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
