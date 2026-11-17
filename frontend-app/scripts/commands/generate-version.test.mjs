import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const generator = fileURLToPath(new URL('./generate-version.mjs', import.meta.url));

// regression: version-source — el respaldo compilado debe corresponder al artefacto.
for (const [label, override, expected] of [
  ['package.json cuando no hay override', undefined, '9.8.7'],
  ['APP_VERSION cuando CI identifica el build', ' 9.8.7+123 ', '9.8.7+123'],
  ['package.json cuando el override está vacío', '   ', '9.8.7'],
]) {
  test(`debe emitir una versión coherente desde ${label}`, () => {
    const root = mkdtempSync(join(tmpdir(), 'frontend-version-'));
    try {
      mkdirSync(join(root, 'public'));
      writeFileSync(join(root, 'package.json'), JSON.stringify({ version: '9.8.7' }));
      const env = { ...process.env };
      delete env.APP_VERSION;
      if (override !== undefined) env.APP_VERSION = override;
      execFileSync(process.execPath, [generator], { cwd: root, env, stdio: 'pipe' });
      const json = JSON.parse(readFileSync(join(root, 'public/version.json'), 'utf8'));
      const compiled = readFileSync(
        join(root, 'src/environments/app-version.generated.ts'),
        'utf8',
      );
      assert.equal(json.version, expected);
      assert.ok(compiled.includes(`export const APP_VERSION = ${JSON.stringify(expected)};`));
      assert.deepEqual(json.changes, []);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}
