/**
 * config/baseline.mjs — Deuda arquitectónica aceptada.
 *
 * GENERADO por `npm run rules:baseline`. Cada clave es un hallazgo que ya
 * existía al introducir el motor. El check falla ante hallazgos NUEVOS.
 * Elimina entradas al corregir la deuda; no las añadas para silenciar
 * violaciones nuevas.
 */
export const baseline = {
  'architecture-types': [],
  'architecture-layers': [],
  'architecture-config': [],
  'architecture-packaging': [
    'src/app/core/services/seo',
    'src/app/features/ai-scraper/interceptors/ai-scraper-auth',
    'src/app/features/auth/guards/auth',
    'src/app/features/auth/interceptors/auth',
    'src/app/features/products/resolvers/storefront',
    'src/app/features/vendor/guards/vendor',
  ],
};

/** Claves aceptadas para una suite (para validar el propio baseline). */
export function baselineFor(suiteId) {
  return new Set(baseline[suiteId] ?? []);
}
