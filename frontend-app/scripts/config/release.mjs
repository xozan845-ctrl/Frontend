/**
 * config/release.mjs — política de releases por tag (R-CD-3 / R-GB-3).
 *
 * El tag es la fuente de verdad de la release. Desde `VERSION_MATCH_FROM`, los
 * `package.json` y el lockfile deben declarar la misma versión que el tag. Los
 * tags anteriores se consideran históricos y se eximen para no romper la
 * reproducción de releases ya publicadas.
 */

/** Tag de release aceptado: `v<major>.<minor>.<patch>[-pre]`. */
export const RELEASE_TAG_PATTERN = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/** Primer tag con exigencia de versiones alineadas. */
export const VERSION_MATCH_FROM = 'v1.24.0';

/** Rama de producción contra la que se valida la procedencia. */
export const DEFAULT_MAIN_REF = 'origin/main';
