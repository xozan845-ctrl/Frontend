import { defineSuite } from '../../engine/suite.mjs';
import { getBranchContext, getChangedFiles } from '../../engine/lib/git.mjs';
import { evaluateDocsSync } from '../../engine/lib/docs-sync.mjs';
import { DOCS_SYNC_EXEMPTIONS, DOCS_SYNC_GATES, MAIN_BRANCH } from '../../config/project.mjs';

/**
 * R-DO-8 — Sincronización docs↔código en PRs.
 *
 * Se activa en el PR (no en push a `main`): compara los archivos cambiados
 * (`origin/main...HEAD`) y, si se tocó lógica/contratos, exige que el mismo PR
 * actualice la documentación requerida. Las excepciones justificadas viven en
 * `DOCS_SYNC_EXEMPTIONS` (`config/project.mjs`).
 */

const isMain = (branch) => branch === MAIN_BRANCH || branch === `origin/${MAIN_BRANCH}`;
/** Las actualizaciones de Dependabot no introducen lógica de producto. */
const isDependabotBranch = (branch) => branch.startsWith('dependabot/');

export default defineSuite({
  id: 'docs-sync',
  area: 'documentation',
  rules: ['R-DO-8'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-DO-8: los cambios de lógica/CI actualizan la documentación necesaria', () => {
      const { currentBranch, baseBranch } = getBranchContext(MAIN_BRANCH);
      if (isMain(currentBranch) || isDependabotBranch(currentBranch)) return;

      const changedFiles = getChangedFiles(baseBranch, MAIN_BRANCH);
      if (changedFiles.length === 0) return;

      const findings = evaluateDocsSync(changedFiles, {
        gates: DOCS_SYNC_GATES,
        exemptions: DOCS_SYNC_EXEMPTIONS,
      });

      const message = findings
        .map((finding) => {
          const files =
            finding.files.length > 8
              ? `${finding.files.slice(0, 8).join(', ')} …`
              : finding.files.join(', ');
          return `- ${finding.gate}: ${finding.reason}\n    tocados: ${files}`;
        })
        .join('\n');

      assert.deepEqual(
        findings,
        [],
        `Hay cambios de código sin la documentación requerida (R-DO-8):\n${message}`,
      );
    });
  },
});
