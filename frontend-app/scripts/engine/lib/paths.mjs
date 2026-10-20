/**
 * Rutas del motor de gobernanza del frontend.
 *
 * Layout:
 *   <repo>/frontend-app/scripts/engine/lib/paths.mjs   ← este archivo
 *   scriptsRoot = <repo>/frontend-app/scripts
 *   appRoot     = <repo>/frontend-app          (proyecto Angular)
 *   repoRoot    = <repo>                       (raíz git, para reglas de git)
 *
 * El motor NO conoce datos del proyecto: eso vive en `scripts/config/`.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Directorio `scripts/`. */
export const scriptsRoot = resolve(here, '..', '..');

/** Raíz del proyecto Angular (`frontend-app/`). */
export const appRoot = resolve(scriptsRoot, '..');

/** Raíz del repositorio git (un nivel por encima de `frontend-app/`). */
export const repoRoot = resolve(appRoot, '..');

/** Directorio de suites de reglas (`scripts/rules`). */
export const rulesDir = resolve(scriptsRoot, 'rules');

/** Resuelve una ruta relativa a `frontend-app/`. */
export function resolveInApp(...segments) {
  return resolve(appRoot, ...segments);
}

/** Resuelve una ruta relativa a la raíz del repositorio git. */
export function resolveInRepo(...segments) {
  return resolve(repoRoot, ...segments);
}

/** Convierte una ruta absoluta a URL `file://` (para `import()` dinámico). */
export function toFileUrl(path) {
  return pathToFileURL(path).href;
}
