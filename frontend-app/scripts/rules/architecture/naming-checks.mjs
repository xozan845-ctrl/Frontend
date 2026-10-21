/**
 * Guardas de nomenclatura y DTOs (R-NC-1/2/9/11).
 *
 * - R-NC-1: sufijo por tipo dentro de cada capa.
 * - R-NC-2: `templateUrl`/`styleUrl(s)` apuntan a archivos hermanos existentes.
 * - R-NC-9: los `*.dto.ts` de features exportan `Backend...DTO` y los modelos no importan DTOs.
 * - R-NC-11: claves de `localStorage` con prefijo `ecom_`.
 */
import { existsSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { appRoot, resolveInApp } from '../../engine/lib/paths.mjs';
import { readText, walkFiles } from '../../engine/lib/fs.mjs';
import { lineAt, maskSource } from '../../engine/lib/source.mjs';

const srcRoot = resolveInApp('src/app');
const toRel = (path) => relative(appRoot, path).split(sep).join('/');

const LAYER_SUFFIXES = [
  {
    layer: 'services',
    allowed: [/\.service\.ts$/, /\.port\.ts$/, /\.types\.ts$/, /\.functions\.ts$/],
  },
  { layer: 'repositories', allowed: [/\.repository\.ts$/] },
  { layer: 'adapters', allowed: [/\.adapter\.ts$/] },
  { layer: 'guards', allowed: [/\.guard\.ts$/] },
  { layer: 'interceptors', allowed: [/\.interceptor\.ts$/] },
  { layer: 'resolvers', allowed: [/\.resolver\.ts$/] },
  { layer: 'state', allowed: [/\.store\.ts$/, /\.state\.ts$/] },
];

const finding = (rule, file, line, detail, suffix) => ({
  rule,
  file,
  line,
  detail,
  key: `${file}|${rule}|${suffix}`,
});

/** Hallazgos de R-NC-1/2/11. */
export function findNamingViolations() {
  const findings = [];

  for (const file of walkFiles(
    srcRoot,
    (name) => name.endsWith('.ts') && !name.endsWith('.spec.ts'),
  )) {
    const rel = toRel(file);
    const src = readText(file);
    const masked = maskSource(src);

    for (const { layer, allowed } of LAYER_SUFFIXES) {
      if (!rel.includes(`/${layer}/`)) continue;
      if (layer === 'adapters' && rel.includes('/fixtures/') && /\.fixture\.ts$/.test(rel))
        continue;
      if (!allowed.some((pattern) => pattern.test(rel))) {
        findings.push(finding('R-NC-1', rel, 0, `sufijo no permitido en ${layer}/`, 'suffix'));
      }
    }

    if (rel.endsWith('.component.ts')) {
      for (const match of masked.matchAll(/templateUrl:\s*'([^']+)'/g)) {
        if (!existsSync(join(dirname(file), match[1]))) {
          findings.push(
            finding(
              'R-NC-2',
              rel,
              lineAt(masked, match.index),
              `templateUrl inexistente: ${match[1]}`,
              'templateUrl',
            ),
          );
        }
      }
      for (const match of masked.matchAll(/styleUrls?:\s*\[?\s*'([^']+)'/g)) {
        if (!existsSync(join(dirname(file), match[1]))) {
          findings.push(
            finding(
              'R-NC-2',
              rel,
              lineAt(masked, match.index),
              `styleUrl inexistente: ${match[1]}`,
              'styleUrl',
            ),
          );
        }
      }
    }

    for (const match of masked.matchAll(/localStorage\.(?:get|set|remove)Item\(\s*'([^']+)'/g)) {
      if (!match[1].startsWith('ecom_')) {
        findings.push(
          finding(
            'R-NC-11',
            rel,
            lineAt(masked, match.index),
            `clave localStorage sin prefijo ecom_: ${match[1]}`,
            'literal',
          ),
        );
      }
    }
    for (const match of masked.matchAll(/const\s+([A-Z0-9_]*KEY[A-Z0-9_]*)\s*=\s*'([^']+)'/g)) {
      if (!match[2].startsWith('ecom_')) {
        findings.push(
          finding(
            'R-NC-11',
            rel,
            lineAt(masked, match.index),
            `constante de storage sin prefijo ecom_: ${match[1]}`,
            match[1],
          ),
        );
      }
    }
  }

  return findings;
}

/** Hallazgos de R-NC-9: DTOs de backend y frontera con el modelo de dominio. */
export function findDtoViolations() {
  const findings = [];

  for (const file of walkFiles(
    srcRoot,
    (name) => name.endsWith('.ts') && !name.endsWith('.spec.ts'),
  )) {
    const rel = toRel(file);
    if (!rel.includes('/models/')) continue;
    const masked = maskSource(readText(file));

    if (rel.endsWith('.dto.ts') && rel.startsWith('src/app/features/')) {
      for (const match of masked.matchAll(/export\s+interface\s+([A-Za-z0-9_]+)/g)) {
        if (!/^Backend\w*DTO$/.test(match[1])) {
          findings.push(
            finding(
              'R-NC-9',
              rel,
              lineAt(masked, match.index),
              `DTO sin nombre Backend...DTO: ${match[1]}`,
              match[1],
            ),
          );
        }
      }
    }

    if (rel.endsWith('.model.ts')) {
      for (const match of masked.matchAll(/from\s*'([^']*\.dto)'/g)) {
        findings.push(
          finding(
            'R-NC-9',
            rel,
            lineAt(masked, match.index),
            'el modelo de dominio importa un DTO',
            'import-dto',
          ),
        );
      }
    }
  }

  return findings;
}
