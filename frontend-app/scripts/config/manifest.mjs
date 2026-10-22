/**
 * config/manifest.mjs — Manifiesto de suites de reglas.
 *
 * El runner descubre las suites por `readdir`; este manifiesto hace que
 * `rules:check` falle si falta cualquiera de las suites obligatorias (no se
 * puede borrar una regla ejecutable en silencio).
 *
 * `id`   — identificador que exporta la suite (`defineSuite({ id })`).
 * `file` — ruta relativa a `scripts/`.
 */
export const requiredSuites = [
  { id: 'docs-structure', file: 'rules/docs/structure.test.mjs' },
  { id: 'docs-readmes', file: 'rules/docs/readmes.test.mjs' },
  { id: 'governance-coverage', file: 'rules/docs/coverage.test.mjs' },
  { id: 'docs-sync', file: 'rules/docs/sync.test.mjs' },
  { id: 'audit-freshness', file: 'rules/docs/audit.test.mjs' },
  { id: 'git-commits', file: 'rules/git/commits.test.mjs' },
  { id: 'git-branch', file: 'rules/git/branch.test.mjs' },
  { id: 'architecture-types', file: 'rules/architecture/types.test.mjs' },
  { id: 'architecture-layers', file: 'rules/architecture/layers.test.mjs' },
  { id: 'architecture-lifecycle', file: 'rules/architecture/lifecycle.test.mjs' },
  { id: 'architecture-features', file: 'rules/architecture/features.test.mjs' },
  { id: 'architecture-guards', file: 'rules/architecture/guards.test.mjs' },
  { id: 'naming-guards', file: 'rules/architecture/naming.test.mjs' },
  { id: 'architecture-config', file: 'rules/architecture/config.test.mjs' },
  { id: 'architecture-packaging', file: 'rules/architecture/packaging.test.mjs' },
  { id: 'security-guards', file: 'rules/security/security.test.mjs' },
  { id: 'performance-guards', file: 'rules/frontend/performance.test.mjs' },
  { id: 'store-guards', file: 'rules/frontend/stores.test.mjs' },
  { id: 'coverage-guards', file: 'rules/test/coverage.test.mjs' },
];
