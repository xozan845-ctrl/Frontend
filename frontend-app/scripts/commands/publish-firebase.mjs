import { execFileSync } from 'node:child_process';
import { appendFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { digest } from './artifact.mjs';
import { runSmokeChecks } from './hosting-smoke.mjs';
import { promoteVerifiedArtifact } from './promote-artifact.mjs';

const promotion = JSON.parse(readFileSync('promotion.json', 'utf8'));
const receipt = {
  ...promotion,
  status: 'omitted',
  smoke: 'not-run',
  provider: 'firebase',
  url: process.env.FRONTEND_URL,
  deploymentRunId: process.env.GITHUB_RUN_ID,
};
const credential = join(process.env.RUNNER_TEMP, 'firebase-service-account.json');

try {
  // Evita que un run antiguo encolado reemplace un SHA más reciente. El rollback
  // manual conserva la comprobación de procedencia y permite un ancestro de main.
  const head = execFileSync('git', ['rev-parse', 'origin/main'], { encoding: 'utf8' }).trim();
  if (process.env.AUTOMATIC_PROMOTION === 'true' && head !== promotion.sha) {
    receipt.reason = 'SHA superado por un commit más reciente en main';
  } else if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    receipt.reason = 'Falta FIREBASE_SERVICE_ACCOUNT';
    throw new Error(`Deploy omitido: ${receipt.reason}.`);
  } else {
    receipt.status = 'failed';
    writeFileSync(credential, process.env.FIREBASE_SERVICE_ACCOUNT, { mode: 0o600 });
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credential;
    const result = await promoteVerifiedArtifact({
      directory: '.ci-artifact',
      expected: {
        sha: process.env.SOURCE_SHA,
        repository: process.env.GITHUB_REPOSITORY,
        runId: process.env.CI_RUN_ID,
        runAttempt: process.env.CI_RUN_ATTEMPT,
      },
      publish: async () => {
        mkdirSync('dist/frontend-app', { recursive: true });
        cpSync('.ci-artifact/browser', 'dist/frontend-app/browser', {
          recursive: true,
          force: false,
          errorOnExist: true,
        });
        execFileSync(
          'npx',
          [
            '--yes',
            'firebase-tools@15.33.0',
            'deploy',
            '--only',
            'hosting',
            '--non-interactive',
            '--message',
            `SHA ${promotion.sha}; SHA-256 ${promotion.content_sha256}`,
          ],
          { stdio: 'inherit' },
        );
        return {};
      },
      smoke: async (manifest) => {
        receipt.smoke = 'failed';
        await runSmokeChecks({
          baseUrl: process.env.FRONTEND_URL,
          expectedFiles: Object.fromEntries(
            manifest.files
              .filter((file) => ['index.html', 'config.json', 'version.json'].includes(file.path))
              .map((file) => [`/${file.path}`, file.sha256]),
          ),
        });
        // Comprueba también que la copia entregada al CLI mantiene todos los bytes.
        for (const file of manifest.files) {
          if (digest(readFileSync(join('dist/frontend-app/browser', file.path))) !== file.sha256) {
            throw new Error(`El archivo publicado cambió: ${file.path}`);
          }
        }
        receipt.smoke = 'passed';
      },
    });
    Object.assign(receipt, result);
  }
} catch (error) {
  receipt.reason = error.message;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  rmSync(credential, { force: true });
  writeFileSync('deployment.json', `${JSON.stringify(receipt, null, 2)}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### Firebase: ${receipt.status}\n\n\`\`\`json\n${JSON.stringify(receipt, null, 2)}\n\`\`\`\n`,
    );
  }
}
