import { existsSync, statSync } from 'node:fs';
import { defineSuite } from '../../engine/suite.mjs';
import { resolveInApp } from '../../engine/lib/paths.mjs';
import { readText } from '../../engine/lib/fs.mjs';
import { REQUIRED_READMES } from '../../config/project.mjs';

/**
 * R-DO-7 — README por directorio importante.
 *
 * Los directorios con contrato propio deben explicar su responsabilidad en un
 * `README.md` no vacío y con título. La lista es configuración del proyecto
 * (`REQUIRED_READMES`), no lógica del motor. Las áreas de `docs/rules` siguen
 * validándose por su propia convención (R-DO-6, suite `docs-structure`).
 */
export default defineSuite({
  id: 'docs-readmes',
  area: 'documentation',
  rules: ['R-DO-7'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('R-DO-7: los directorios importantes tienen README con título', () => {
      const missing = [];
      const empty = [];
      const untitled = [];

      for (const rel of REQUIRED_READMES) {
        const absolute = resolveInApp(rel);

        if (!existsSync(absolute) || !statSync(absolute).isFile()) {
          missing.push(rel);
          continue;
        }

        const content = readText(absolute).trim();
        if (!content) {
          empty.push(rel);
          continue;
        }

        if (!content.startsWith('# ')) untitled.push(rel);
      }

      assert.deepEqual(
        missing,
        [],
        `Faltan README.md obligatorios (R-DO-7):\n  - ${missing.join('\n  - ')}`,
      );
      assert.deepEqual(empty, [], `README.md vacíos (R-DO-7): ${empty.join(', ')}`);
      assert.deepEqual(untitled, [], `README.md sin título '# ' (R-DO-7): ${untitled.join(', ')}`);
    });
  },
});
