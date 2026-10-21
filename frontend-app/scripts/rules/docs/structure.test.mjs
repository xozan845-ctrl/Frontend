import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { defineSuite } from '../../engine/suite.mjs';
import { appRoot, resolveInApp } from '../../engine/lib/paths.mjs';
import { readText, walkMarkdown } from '../../engine/lib/fs.mjs';
import { getRuleAreas, getRuleFiles } from '../../engine/lib/rules-docs.mjs';
import { RULES_DIR } from '../../config/project.mjs';
import { requiredSuites } from '../../config/manifest.mjs';

/**
 * Integridad del propio sistema de reglas: manifiesto de suites, estructura de
 * `docs/rules`, unicidad de IDs y enlaces internos.
 */

const rulesRoot = resolveInApp(RULES_DIR);
const RULE_ID_ROW = /^\|\s*(?:\*\*)?((?:R-[A-Z]+|G)-\d+)(?:\*\*)?\s*\|/gm;

export default defineSuite({
  id: 'docs-structure',
  area: 'documentation',
  rules: ['R-DO-6'],
  mode: 'repo',
  run: ({ test, assert }) => {
    test('Existen todas las suites de reglas del manifiesto (no se borra una regla en silencio)', () => {
      const missing = requiredSuites
        .filter((suite) => !existsSync(resolveInApp('scripts', suite.file)))
        .map((suite) => suite.file);

      assert.deepEqual(
        missing,
        [],
        `Faltan suites de reglas obligatorias del manifiesto (scripts/config/manifest.mjs): ${missing.join(', ')}`,
      );
    });

    test('Estructura de áreas: cada área tiene README.md y está enlazada en el índice raíz', () => {
      const areas = getRuleAreas(rulesRoot);
      const rootIndex = readText(join(rulesRoot, 'README.md'));

      for (const area of areas) {
        const directory = join(rulesRoot, area);
        assert.ok(
          existsSync(join(directory, 'README.md')),
          `El área ${area}/ no tiene archivo README.md requerido`,
        );
        assert.ok(
          rootIndex.includes(`./${area}/README.md`),
          `El índice docs/rules/README.md no enlaza el área ./${area}/README.md`,
        );

        for (const entry of readdirSync(directory, { withFileTypes: true })) {
          if (!entry.isFile() || !entry.name.endsWith('.md') || entry.name === 'README.md') {
            continue;
          }
          assert.match(
            entry.name,
            /^\d{2}-.+\.md$/,
            `${area}/${entry.name}: el nombre debe seguir la convención NN-tema.md`,
          );

          const content = readText(join(directory, entry.name));
          const number = entry.name.slice(0, 2);
          assert.ok(
            content.startsWith(`# ${number} — `),
            `${area}/${entry.name}: el título debe comenzar con '# ${number} — '`,
          );
        }
      }
    });

    test('Unicidad de IDs: cada ID de regla se define exactamente una vez', () => {
      const definitions = new Map();

      for (const path of getRuleFiles(rulesRoot)) {
        const content = readText(path);
        const ids = [...content.matchAll(RULE_ID_ROW)].map((match) => match[1]);

        for (const id of ids) {
          const previous = definitions.get(id);
          assert.ok(
            !previous,
            `${id} está duplicado: definido en ${relative(appRoot, path)} y ${previous ? relative(appRoot, previous) : ''}`,
          );
          definitions.set(id, path);
        }
      }
    });

    test('Enlaces locales: todos los enlaces Markdown internos de docs/rules existen', () => {
      const history = join(rulesRoot, '_meta', 'AUDIT-HISTORY.md');

      for (const path of walkMarkdown(rulesRoot).filter((file) => file !== history)) {
        const content = readText(path);
        for (const match of content.matchAll(/!?(?:\[[^\]]*\])\(([^)]+)\)/g)) {
          let target = match[1].trim();
          if (!target || target.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(target)) {
            continue;
          }
          if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
          target = target.split('#', 1)[0].split('?', 1)[0];
          try {
            target = decodeURIComponent(target);
          } catch {
            assert.fail(
              `${relative(appRoot, path)}: enlace local con encoding inválido: ${match[1]}`,
            );
          }
          assert.ok(
            existsSync(resolve(dirname(path), target)),
            `${relative(appRoot, path)}: enlace local roto -> ${match[1]}`,
          );
        }
      }
    });
  },
});
