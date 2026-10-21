/**
 * Cobertura del motor de reglas (R-DO-9). Separa lo que una suite **verifica**
 * (`rules`) de lo que solo **contextualiza** (`cites`), y detecta IDs citados
 * sin definición en `docs/rules`.
 *
 * `collectSuiteMetadata` lee la metadata de las suites sin ejecutarlas;
 * `analyzeRuleCoverage` es puro y recibe los datos ya extraídos.
 */
import { walkFiles, readText } from './fs.mjs';

const ID_ARRAY = (content, field) => {
  const match = content.match(new RegExp(`\\b${field}:\\s*\\[([\\s\\S]*?)\\]`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
};

/** Metadata de las suites (`id`, `area`, `rules`, `cites`) sin ejecutarlas. */
export function collectSuiteMetadata(rulesDir) {
  return walkFiles(rulesDir, (name) => name.endsWith('.test.mjs'))
    .map((file) => {
      const content = readText(file);
      return {
        id: content.match(/\bid:\s*'([^']+)'/)?.[1] ?? file,
        area: content.match(/\barea:\s*'([^']+)'/)?.[1],
        rules: ID_ARRAY(content, 'rules'),
        cites: ID_ARRAY(content, 'cites'),
        file,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Analiza la cobertura declarada.
 * @param {object} input
 * @param {Array<{id: string, rules?: string[], cites?: string[]}>} input.suites
 * @param {Set<string>} input.definedIds IDs definidos en `docs/rules`.
 * @param {number} [input.minVerified] Suelo de reglas verificadas.
 */
export function analyzeRuleCoverage({ suites, definedIds, minVerified = 0 }) {
  const verified = new Set();
  const cited = new Set();
  const unknown = [];
  const duplicates = [];

  for (const suite of suites) {
    const rules = suite.rules ?? [];
    const cites = suite.cites ?? [];
    const ruleSet = new Set(rules);
    const citeSet = new Set(cites);

    for (const id of ruleSet) {
      if (!definedIds.has(id)) unknown.push({ suite: suite.id, id, kind: 'rules' });
      else verified.add(id);
    }
    for (const id of citeSet) {
      if (!definedIds.has(id)) unknown.push({ suite: suite.id, id, kind: 'cites' });
      cited.add(id);
    }
    for (const id of ruleSet) {
      if (citeSet.has(id)) duplicates.push({ suite: suite.id, id });
    }
  }

  const contextual = [...cited].filter((id) => !verified.has(id)).sort();

  return {
    defined: definedIds.size,
    verified: [...verified].sort(),
    contextual,
    unknown,
    duplicates,
    minVerified,
    belowFloor: verified.size < minVerified,
  };
}
