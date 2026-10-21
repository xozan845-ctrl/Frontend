import { defineSuite } from '../../engine/suite.mjs';
import { getBranchContext, getCommitsAgainstBase } from '../../engine/lib/git.mjs';
import { validateBranchName, validateCommitSubject } from '../../engine/lib/commits.mjs';
import { ALLOWED_COMMIT_SCOPES, ALLOWED_COMMIT_TYPES, MAIN_BRANCH } from '../../config/project.mjs';

/**
 * R-GC-1..4 y R-GB-2 (parte contextual): la rama del PR y los commits que
 * introduce deben cumplir el convenio del repo. Inspecciona git real.
 *
 * Se ejecuta en el PR (GITHUB_HEAD_REF/GITHUB_BASE_REF) y se omite en `main`,
 * donde no hay commits de rama que evaluar.
 */

const allowed = {
  types: ALLOWED_COMMIT_TYPES,
  scopes: ALLOWED_COMMIT_SCOPES,
};

const isMain = (branch) => branch === MAIN_BRANCH || branch === `origin/${MAIN_BRANCH}`;

export default defineSuite({
  id: 'git-branch',
  area: 'git',
  rules: ['R-GC-1', 'R-GC-2', 'R-GC-3', 'R-GC-4', 'R-GB-2'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-GB-2: la rama del PR sigue el patrón <tipo>/<ámbito>-<descripción>', () => {
      const { currentBranch } = getBranchContext(MAIN_BRANCH);
      if (isMain(currentBranch)) return;

      const problems = validateBranchName(currentBranch, allowed);
      assert.deepEqual(
        problems,
        [],
        `Rama '${currentBranch}' no conforme (R-GB-2):\n${problems.join('\n')}`,
      );
    });

    test('R-GC-1..4: los commits introducidos por el PR cumplen el convenio', () => {
      const { currentBranch, baseBranch } = getBranchContext(MAIN_BRANCH);
      if (isMain(currentBranch)) return;

      const commits = getCommitsAgainstBase(baseBranch, MAIN_BRANCH);
      if (commits.length === 0) return;

      const problems = [];
      for (const { subject } of commits) {
        const errors = validateCommitSubject(subject, allowed);
        if (errors.length > 0) {
          problems.push(`- "${subject}"\n    ${errors.join('\n    ')}`);
        }
      }

      assert.deepEqual(
        problems,
        [],
        `Commits no conformes a Conventional Commits (R-GC-1..4):\n${problems.join('\n')}`,
      );
    });
  },
});
