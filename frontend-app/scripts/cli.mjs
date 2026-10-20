/**
 * cli.mjs — Único entrypoint del motor de gobernanza del frontend.
 *
 * Es el composition root: la única capa que puede importar de engine/, config/,
 * rules/ y tools/. Los `npm scripts` y el wrapper `check-rules.mjs` delegan aquí.
 *
 * Uso:
 *   node scripts/cli.mjs rules [--only <id|area>] [--mode pure|repo] [--reporter spec|tap|dot|junit]
 *   node scripts/cli.mjs baseline
 */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { runRules } from './engine/runner.mjs';
import { rulesDir, resolveInApp } from './engine/lib/paths.mjs';
import { requiredSuites } from './config/manifest.mjs';
import { RULES_DIR } from './config/project.mjs';
import {
  findHardcodedConfig,
  findLayerViolations,
  findTypeDeclarations,
} from './rules/architecture/checks.mjs';

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = args[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags[key] = next;
      i += 1;
    } else {
      flags[key] = true;
    }
  }
  return flags;
}

async function rulesCommand(args) {
  const flags = parseFlags(args);
  return runRules({
    rulesDir,
    requiredSuites,
    docsRulesRoot: resolveInApp(RULES_DIR),
    only: typeof flags.only === 'string' ? flags.only : undefined,
    mode: typeof flags.mode === 'string' ? flags.mode : undefined,
    reporter: typeof flags.reporter === 'string' ? flags.reporter : 'spec',
  });
}

async function baselineCommand() {
  const sections = {
    'architecture-types': findTypeDeclarations(),
    'architecture-layers': findLayerViolations(),
    'architecture-config': findHardcodedConfig(),
  };

  const lines = [
    '/**',
    ' * config/baseline.mjs — Deuda arquitectónica aceptada.',
    ' *',
    ' * GENERADO por `npm run rules:baseline`. Cada clave es un hallazgo que ya',
    ' * existía al introducir el motor. El check falla ante hallazgos NUEVOS.',
    ' * Elimina entradas al corregir la deuda; no las añadas para silenciar',
    ' * violaciones nuevas.',
    ' */',
    'export const baseline = {',
  ];

  const quote = (value) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

  for (const [suiteId, findings] of Object.entries(sections)) {
    const keys = [...new Set(findings.map((finding) => finding.key))].sort();
    lines.push(`  '${suiteId}': [`);
    for (const key of keys) lines.push(`    ${quote(key)},`);
    lines.push('  ],');
  }

  lines.push(
    '};',
    '',
    '/** Claves aceptadas para una suite (para validar el propio baseline). */',
    'export function baselineFor(suiteId) {',
    '  return new Set(baseline[suiteId] ?? []);',
    '}',
    '',
  );

  writeFileSync(resolveInApp('scripts/config/baseline.mjs'), lines.join('\n'));
  const total = Object.values(sections).reduce((sum, findings) => sum + findings.length, 0);
  console.log(`Baseline actualizado: ${total} hallazgo(s) aceptados como deuda.`);
  return 0;
}

const COMMANDS = {
  rules: rulesCommand,
  baseline: baselineCommand,
};

/**
 * Ejecuta un comando del CLI.
 * @param {string[]} [argv] Argumentos (por defecto, los del proceso).
 * @returns {Promise<number>} Código de salida.
 */
export async function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  const handler = COMMANDS[command];

  if (!handler) {
    console.error(
      `Comando desconocido: ${command ?? '(ninguno)'}. Usa: ${Object.keys(COMMANDS).join(' | ')}`,
    );
    return 1;
  }

  const result = await handler(rest);
  return typeof result === 'number' ? result : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
