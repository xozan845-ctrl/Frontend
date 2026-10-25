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

/**
 * Rutas que forman parte del artefacto de la app. Un cambio fuera de estas
 * rutas (CI, docs, tests, scripts) no exige una release de frontend.
 */
export const APP_ARTIFACT_PATTERNS = [
  /^frontend-app\/src\//,
  /^frontend-app\/public\//,
  /^frontend-app\/angular\.json$/,
  /^frontend-app\/tsconfig(?:\.[^/]+)?\.json$/,
  /^frontend-app\/ngsw-config\.json$/,
  /^frontend-app\/postcss\.config\.json$/,
  /^frontend-app\/tailwind\.config\.js$/,
  /^frontend-app\/firebase\.json$/,
  /^frontend-app\/\.firebaserc$/,
  /^Dockerfile$/,
  /^nginx\.conf$/,
  /^docker-entrypoint\.d\//,
];

/** Archivos dentro de `src/` que no forman parte del bundle de producción. */
export const APP_ARTIFACT_EXCLUDES = [/\.spec\.ts$/, /\/test-setup\.ts$/, /\/mocks\//];

/** Dependencias: solo cuentan si el commit es `build(deps)`/`fix(deps)`. */
export const DEPENDENCY_ARTIFACT_PATTERNS = [
  /^frontend-app\/package\.json$/,
  /^frontend-app\/package-lock\.json$/,
];
