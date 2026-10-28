import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildReadiness,
  bumpVersion,
  classifyCommit,
  commitTouchesArtifact,
  isArtifactFile,
  maxImpact,
} from './release-readiness.mjs';

test('release readiness: clasifica commits por impacto semver', () => {
  assert.equal(classifyCommit('feat(products): añadir filtro'), 'minor');
  assert.equal(classifyCommit('fix(ui): corregir contraste'), 'patch');
  assert.equal(classifyCommit('refactor(state): simplificar selector'), 'patch');
  assert.equal(classifyCommit('docs(rules): actualizar README'), 'none');
  assert.equal(classifyCommit('feat(api)!: cambiar contrato'), 'major');
  assert.equal(classifyCommit('fix(api): cambio', 'BREAKING CHANGE: cambia el contrato'), 'major');
  assert.equal(maxImpact(['patch', 'minor', 'patch']), 'minor');
});

test('release readiness: calcula el siguiente tag', () => {
  assert.equal(bumpVersion('1.24.0', 'patch'), 'v1.24.1');
  assert.equal(bumpVersion('1.24.0', 'minor'), 'v1.25.0');
  assert.equal(bumpVersion('1.24.0', 'major'), 'v2.0.0');
});

test('release readiness: separa artefacto de app, tests, docs y dependencias', () => {
  assert.equal(isArtifactFile('frontend-app/src/app/features/products/x.ts'), true);
  assert.equal(isArtifactFile('frontend-app/src/app/features/products/x.spec.ts'), false);
  assert.equal(isArtifactFile('frontend-app/src/test-setup.ts'), false);
  assert.equal(isArtifactFile('frontend-app/docs/rules/ci/README.md'), false);
  assert.equal(isArtifactFile('frontend-app/package.json'), false);
  assert.equal(
    commitTouchesArtifact('build(deps): bump fast-uri', ['frontend-app/package.json']),
    true,
  );
  assert.equal(
    commitTouchesArtifact('feat(ci): añadir workflow', ['frontend-app/package.json']),
    false,
  );
  assert.equal(
    commitTouchesArtifact('feat(products): añadir filtro', ['frontend-app/src/app/x.ts']),
    true,
  );
});

test('release readiness: detecta release, tag pendiente y estado al día', () => {
  const feature = [{ subject: 'feat(products): añadir filtro' }];

  assert.deepEqual(
    buildReadiness({
      lastTag: 'v1.24.0',
      packageVersion: '1.24.0',
      artifactCommits: feature,
    }).status,
    'release-pending',
  );
  assert.equal(
    buildReadiness({
      lastTag: 'v1.24.0',
      packageVersion: '1.24.0',
      artifactCommits: feature,
    }).expectedTag,
    'v1.25.0',
  );
  assert.equal(
    buildReadiness({
      lastTag: 'v1.24.0',
      packageVersion: '1.25.0',
      artifactCommits: feature,
    }).status,
    'tag-pending',
  );
  assert.equal(
    buildReadiness({
      lastTag: 'v1.24.0',
      packageVersion: '1.25.0',
      artifactCommits: feature,
      packageTagOnMain: true,
    }).status,
    'released',
  );
  assert.equal(
    buildReadiness({
      lastTag: 'v1.24.0',
      packageVersion: '1.24.0',
      artifactCommits: [],
    }).status,
    'up-to-date',
  );
  assert.equal(
    buildReadiness({
      lastTag: 'v1.24.0',
      packageVersion: '1.25.0',
      artifactCommits: [],
    }).status,
    'version-ahead',
  );
});
