// Contrato de promoción independiente del proveedor de publicación (F35).
export const CI_GATES = {
  'security-gate': 'Security Gate',
  format: 'Format (Prettier)',
  lint: 'ESLint',
  typecheck: 'Typecheck',
  rules: 'Governance Rules',
  test: 'Unit Tests + Coverage',
  build: 'Build',
  e2e: 'E2E (Playwright)',
  actionlint: 'Actionlint',
  shellcheck: 'Shellcheck',
  hadolint: 'Hadolint',
  gitleaks: 'Gitleaks',
  lighthouse: 'Lighthouse',
};

export const VALIDATED_JOB = 'Validated artifact';
export const artifactName = (runId, attempt) => `frontend-validated-${runId}-${attempt}`;

export function assertGates(needs) {
  for (const id of Object.keys(CI_GATES)) {
    if (needs[id]?.result !== 'success') {
      throw new Error(`Promoción bloqueada: ${id} = ${needs[id]?.result ?? 'missing'}.`);
    }
  }
}

export function assertTrustedRun(run, { repository, workflowId, sha } = {}) {
  if (
    run.workflow_id !== workflowId ||
    run.path !== '.github/workflows/ci.yml' ||
    run.event !== 'push' ||
    run.head_branch !== 'main' ||
    run.head_repository?.full_name !== repository ||
    run.repository?.full_name !== repository ||
    run.status !== 'completed' ||
    run.conclusion !== 'success' ||
    !/^[a-f0-9]{40}$/.test(run.head_sha) ||
    (sha && run.head_sha !== sha)
  ) {
    throw new Error(
      'Promoción bloqueada: se exige CI completa, verde y de un push a main del mismo SHA/repositorio.',
    );
  }
}

export function assertJobs(jobs) {
  for (const name of [...Object.values(CI_GATES), VALIDATED_JOB]) {
    const job = jobs.find((entry) => entry.name === name);
    if (job?.status !== 'completed' || job.conclusion !== 'success') {
      throw new Error(`Promoción bloqueada: gate ${name} sin éxito verificable.`);
    }
  }
}
