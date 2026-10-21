/**
 * config/project.mjs — Frontend (Quantum Store)
 * ──────────────────────────────────────────────────────────────────────────────
 * Datos y política específicos de ESTE proyecto para el motor de reglas
 * (`scripts/engine/`). Es la capa de configuración: solo datos, sin lógica del
 * motor. Al portar el motor a otro repo Angular se edita este archivo (y
 * `manifest.mjs` + `baseline.mjs`); `scripts/engine/` no se toca.
 * ──────────────────────────────────────────────────────────────────────────────
 */

/** Rama principal del repositorio. */
export const MAIN_BRANCH = 'main';

/** Árbol normativo de reglas (lo lee el motor para el reporte de cobertura). */
export const RULES_DIR = 'docs/rules';

/** Raíz del código Angular, relativa a `frontend-app/`. */
export const APP_SRC_DIR = 'src/app';

/**
 * Archivos que SÍ pueden declarar `interface`/`type`/`enum`.
 * El resto son archivos de implementación: los tipos deben vivir aparte.
 */
export const TYPE_DECLARATION_FILE_PATTERNS = [
  /\/models\//,
  /\.model\.ts$/,
  /\.dto\.ts$/,
  /\.types\.ts$/,
  /\.port\.ts$/,
  /\.state\.ts$/,
  /\.repository\.ts$/,
  /\.spec\.ts$/,
  /public-api\.ts$/,
  /public-ui\.ts$/,
];

/**
 * Capas de un feature (`features/<feature>/<capa>/`). Cada capa declara qué
 * capas del MISMO feature puede importar. `null` = sin restricción dentro del
 * feature (sujeto a las reglas globales).
 */
export const FEATURE_LAYER_DEPENDENCIES = {
  models: new Set(['models']),
  repositories: new Set(['models', 'repositories']),
  adapters: new Set(['models', 'adapters']),
  services: new Set(['models', 'repositories', 'adapters', 'services', 'constants']),
  state: new Set(['models', 'repositories', 'services', 'state', 'constants']),
  pages: new Set([
    'models',
    'state',
    'pages',
    'components',
    'constants',
    'guards',
    'interceptors',
    'resolvers',
  ]),
  components: new Set(['models', 'components', 'constants']),
  guards: new Set(['models', 'services', 'repositories', 'state', 'guards']),
  interceptors: new Set([
    'models',
    'services',
    'repositories',
    'state',
    'guards',
    'constants',
    'interceptors',
  ]),
  resolvers: new Set(['models', 'services', 'repositories', 'state', 'resolvers']),
  constants: new Set(['models', 'constants']),
  mocks: new Set(['models', 'mocks', 'constants']),
};

/** Ficheros raíz de un feature que se consideran capa `root`. */
export const FEATURE_ROOT_FILES = new Set(['public-api.ts', 'public-ui.ts']);

/** Ficheros de composición exentos de las reglas de capas. */
export const COMPOSITION_FILES = new Set(['src/app/app.config.ts', 'src/app/app.routes.ts']);

/** Ficheros donde está permitido inyectar `HttpClient` (R-AR-8). */
export const HTTP_CLIENT_ALLOWED = [
  /\.service\.ts$/,
  /\/services\//,
  /\/interceptors\//,
  /\.spec\.ts$/,
];

/** Archivos de composición de rutas: pueden importar guards de otro feature. */
export const ROUTES_FILE = /(^|\/)[^/]+\.routes\.ts$/;

/** Hosts/enlaces no-API permitidos sin pasar por configuración. */
export const HARDCODED_URL_ALLOWLIST = [/^https:\/\/wa\.me\//, /^https:\/\/www\.w3\.org\//];

/** Prefijos de imports externos permitidos en `models/` (R-CX-4: dominio puro). */
export const MODEL_ALLOWED_EXTERNAL = [];

/**
 * Carpetas de capa donde una unidad lógica con ≥ 2 archivos debe vivir en su
 * propia subcarpeta `<unidad>/` (R-AR-14).
 */
export const UNIT_LAYERS = new Set([
  'state',
  'services',
  'repositories',
  'adapters',
  'guards',
  'interceptors',
  'resolvers',
]);

/** Mínimo de archivos de una unidad para exigir subcarpeta (R-AR-14). */
export const MIN_UNIT_FILES = 2;

/**
 * README.md obligatorios en los directorios con contrato propio (R-DO-7).
 * Rutas relativas a `frontend-app/`. Las áreas de `docs/rules` se validan
 * aparte por su convención `README.md` + `NN-tema.md` (R-DO-6).
 */
export const REQUIRED_READMES = [
  'README.md',
  'docs/README.md',
  'scripts/README.md',
  'src/app/README.md',
  'src/app/core/README.md',
  'src/app/shared/README.md',
  'src/app/layout/README.md',
  'src/app/features/README.md',
];

/**
 * Tipos de Conventional Commits admitidos (R-GC-1). `audit` no está admitido:
 * la auditoría se documenta con `docs(...)`.
 */
export const ALLOWED_COMMIT_TYPES = [
  'feat',
  'fix',
  'docs',
  'test',
  'refactor',
  'perf',
  'style',
  'ci',
  'build',
  'chore',
];

/**
 * Ámbitos reales del repo (R-GC-1): features, capas/piezas y áreas de
 * gobernanza/entrega/documentación.
 */
export const ALLOWED_COMMIT_SCOPES = [
  // Features
  'account',
  'ai-scraper',
  'auth',
  'billing',
  'cart',
  'checkout',
  'home',
  'logistica',
  'plans',
  'products',
  'stores',
  'vendor',
  'wishlist',
  // Capas y piezas de la app
  'adapters',
  'api',
  'components',
  'config',
  'core',
  'features',
  'footer',
  'guards',
  'images',
  'interceptors',
  'layout',
  'mocks',
  'models',
  'navbar',
  'repositories',
  'resolvers',
  'routing',
  'services',
  'shared',
  'shared-ui',
  'state',
  'storefront',
  'ui',
  // Gobernanza, entrega y documentación
  'architecture',
  'audit',
  'cd',
  'ci',
  'cobertura',
  'contrato',
  'decisiones',
  'deps',
  'di',
  'docs',
  'e2e',
  'git',
  'lifecycle',
  'packaging',
  'release',
  'robustez',
  'rules',
  'security',
  'seo',
  'structure',
  'test',
  'tsconfig',
];
