import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { CI_GATES, VALIDATED_JOB, artifactName, assertGates } from '../config/promotion.mjs';
import { packArtifact, verifyArtifact } from './artifact.mjs';
import { promoteVerifiedArtifact, selectArtifact } from './promote-artifact.mjs';

const sha = 'a'.repeat(40);
const repository = 'test/frontend';
const run = {
  id: 123,
  run_attempt: 2,
  workflow_id: 1,
  path: '.github/workflows/ci.yml',
  event: 'push',
  head_branch: 'main',
  head_sha: sha,
  status: 'completed',
  conclusion: 'success',
  head_repository: { full_name: repository },
  repository: { full_name: repository },
};
const jobs = [...Object.values(CI_GATES), VALIDATED_JOB].map((name) => ({
  name,
  status: 'completed',
  conclusion: 'success',
}));
const artifact = {
  id: 456,
  name: artifactName(run.id, run.run_attempt),
  expired: false,
  digest: `sha256:${'b'.repeat(64)}`,
  workflow_run: { id: run.id, head_sha: sha },
};

function apiDouble({ source = run, gates = jobs, artifacts = [artifact] } = {}) {
  return async (path) => {
    if (path.endsWith('/workflows/ci.yml')) return { id: 1 };
    if (path.includes('/jobs?')) return { jobs: gates, total_count: gates.length };
    if (path.includes('/artifacts?')) return { artifacts, total_count: artifacts.length };
    if (path.includes('/workflows/ci.yml/runs?')) return { workflow_runs: [source] };
    if (path.endsWith('/runs/123')) return source;
    throw new Error(`Petición inesperada: ${path}`);
  };
}

test('regression: F35 live espera CI y release conserva el artefacto validado', () => {
  const workflow = (name) =>
    readFileSync(new URL(`../../../.github/workflows/${name}.yml`, import.meta.url), 'utf8');
  const deploy = workflow('deploy-firebase');
  assert.match(deploy, /workflow_run:/);
  assert.doesNotMatch(deploy, /^  push:/m);
  assert.doesNotMatch(deploy, /npm run build|npm test|npm ci/);
  assert.match(deploy, /promote-artifact\.mjs/);
  const release = workflow('release');
  assert.doesNotMatch(release, /npm run build|npm ci/);
  assert.match(release, /promote-artifact\.mjs/);
  const ci = workflow('ci');
  const promotion = ci.split(/^  promotion:/m)[1];
  assert.ok(promotion, 'CI necesita un gate final de promoción');
  const dependencies = promotion.match(/needs:\s*(\[[\s\S]*?\])/)[1].match(/[a-z][a-z0-9-]*/g);
  assert.deepEqual(new Set(dependencies), new Set(Object.keys(CI_GATES)));
  for (const command of [
    'npm audit --audit-level=high',
    'npm run coverage:diff',
    'npm run e2e',
    'node scripts/commands/check-budget.mjs',
  ])
    assert.ok(ci.includes(command), `Se conserva el control obligatorio: ${command}`);
  assert.match(promotion, /if: always\(\)/);
  assert.match(promotion, /artifact\.mjs seal/);
});

for (const gate of Object.keys(CI_GATES)) {
  for (const result of ['failure', 'cancelled', 'skipped', undefined]) {
    test(`regression: F35 ${gate}=${result ?? 'missing'} impide sellar y publicar`, async () => {
      const needs = Object.fromEntries(
        Object.keys(CI_GATES).map((id) => [id, { result: 'success' }]),
      );
      needs[gate] = result ? { result } : undefined;
      assert.throws(() => assertGates(needs), /Promoción bloqueada/);
      const gates = jobs.map((job) =>
        job.name === CI_GATES[gate] ? { ...job, conclusion: result } : job,
      );
      await assert.rejects(
        selectArtifact({ api: apiDouble({ gates }), repository, runId: 123, sha }),
        /gate/,
      );
    });
  }
}

test('selecciona el run, intento y artefacto exactos del mismo SHA', async () => {
  const selected = await selectArtifact({ api: apiDouble(), repository, sha });
  assert.equal(selected.artifact.id, 456);
  assert.equal(selected.run.head_sha, sha);
});

for (const change of [
  { event: 'pull_request' },
  { event: 'workflow_dispatch' },
  { head_branch: 'feature' },
  { workflow_id: 99 },
  { path: '.github/workflows/other.yml' },
  { head_sha: 'c'.repeat(40) },
  { head_repository: { full_name: 'fork/frontend' } },
  { status: 'in_progress' },
  { conclusion: 'failure' },
  { conclusion: 'cancelled' },
]) {
  test(`rechaza procedencia incompatible: ${JSON.stringify(change)}`, async () => {
    await assert.rejects(
      selectArtifact({
        api: apiDouble({ source: { ...run, ...change } }),
        repository,
        runId: 123,
        sha,
      }),
      /Promoción bloqueada/,
    );
  });
}

for (const artifacts of [
  [],
  [{ ...artifact, expired: true }],
  [{ ...artifact, digest: null }],
  [{ ...artifact, name: artifactName(123, 1) }],
  [artifact, artifact],
  [{ ...artifact, workflow_run: { id: 123, head_sha: 'd'.repeat(40) } }],
]) {
  test(`rechaza artefacto ausente, vencido o de otra identidad: ${JSON.stringify(artifacts)}`, async () => {
    await assert.rejects(
      selectArtifact({ api: apiDouble({ artifacts }), repository, runId: 123, sha }),
    );
  });
}

function fixture(t, version = '1.2.3', sourceSha = sha) {
  const root = mkdtempSync(join(tmpdir(), 'f35-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, 'source');
  const destination = join(root, 'package');
  mkdirSync(source);
  for (const [name, value] of Object.entries({
    'index.html': '<app-root/>',
    'config.json': '{"apiUrl":"https://api.example/api/v1","aiScraperUrl":""}',
    'version.json': JSON.stringify({ version: `${version}+ci.123.2` }),
    'ngsw.json': '{}',
    'invitacion.html': '<app-root/>',
  })) {
    writeFileSync(join(source, name), value);
  }
  const manifest = packArtifact({
    source,
    destination,
    sha: sourceSha,
    repository,
    runId: 123,
    runAttempt: 2,
    version,
  });
  return { destination, manifest };
}

test('el destino doble recibe los mismos bytes y hash; permite rollback sin recompilar', async (t) => {
  const previous = fixture(t);
  const current = fixture(t, '1.2.4', 'c'.repeat(40));
  const published = [];
  const publish = async (value) => {
    published.push(value.contentSha256);
    return { provider: 'double' };
  };
  const smoke = async (value) => assert.equal(value.contentSha256, published.at(-1));
  for (const { destination, manifest } of [previous, current, previous]) {
    const result = await promoteVerifiedArtifact({
      directory: destination,
      expected: { sha: manifest.sha, version: manifest.version },
      publish,
      smoke,
    });
    assert.equal(result.status, 'deployed');
    assert.equal(result.contentSha256, manifest.contentSha256);
  }
  assert.notEqual(previous.manifest.contentSha256, current.manifest.contentSha256);
  assert.deepEqual(published, [
    previous.manifest.contentSha256,
    current.manifest.contentSha256,
    previous.manifest.contentSha256,
  ]);
  assert.deepEqual(previous.manifest.apiVersions, { core: 'v1', ai: null });
});

for (const mutation of ['modify', 'add', 'delete', 'sha', 'version', 'attempt']) {
  test(`la alteración ${mutation} bloquea el destino antes de publicar`, async (t) => {
    const { destination } = fixture(t);
    const expected = { sha, version: '1.2.3', runAttempt: 2 };
    if (mutation === 'modify') writeFileSync(join(destination, 'browser/index.html'), 'changed');
    if (mutation === 'add') writeFileSync(join(destination, 'browser/extra.js'), 'injected');
    if (mutation === 'delete') rmSync(join(destination, 'browser/config.json'));
    if (mutation === 'sha') expected.sha = 'd'.repeat(40);
    if (mutation === 'version') expected.version = '9.9.9';
    if (mutation === 'attempt') expected.runAttempt = 1;
    let calls = 0;
    await assert.rejects(
      promoteVerifiedArtifact({
        directory: destination,
        expected,
        publish: async () => {
          calls += 1;
        },
        smoke: async () => {},
      }),
    );
    assert.equal(calls, 0);
  });
}

test('smoke fallido no se registra como entrega exitosa', async (t) => {
  const { destination } = fixture(t);
  await assert.rejects(
    promoteVerifiedArtifact({
      directory: destination,
      expected: { sha },
      publish: async () => ({}),
      smoke: async () => {
        throw new Error('smoke failed');
      },
    }),
    /smoke failed/,
  );
  assert.equal(verifyArtifact(destination).sha, sha);
});
