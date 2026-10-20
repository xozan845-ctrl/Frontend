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
  { id: 'architecture-types', file: 'rules/architecture/types.test.mjs' },
  { id: 'architecture-layers', file: 'rules/architecture/layers.test.mjs' },
  { id: 'architecture-config', file: 'rules/architecture/config.test.mjs' },
];
