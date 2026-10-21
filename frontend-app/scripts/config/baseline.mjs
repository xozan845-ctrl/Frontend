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
    'src/app/core/services/store-config',
    'src/app/features/ai-scraper/adapters/ai-scraper',
    'src/app/features/ai-scraper/interceptors/ai-scraper-auth',
    'src/app/features/ai-scraper/services/ai-job',
    'src/app/features/ai-scraper/services/ai-scraper-error',
    'src/app/features/ai-scraper/services/ai-session',
    'src/app/features/auth/adapters/auth',
    'src/app/features/auth/guards/auth',
    'src/app/features/auth/interceptors/auth',
    'src/app/features/auth/services/auth',
    'src/app/features/cart/adapters/cart',
    'src/app/features/cart/adapters/order',
    'src/app/features/cart/services/cart',
    'src/app/features/cart/services/order',
    'src/app/features/logistica/services/leaflet-api',
    'src/app/features/products/adapters/product',
    'src/app/features/products/resolvers/storefront',
    'src/app/features/products/services/product',
    'src/app/features/stores/adapters/store',
    'src/app/features/stores/services/catalog',
    'src/app/features/stores/services/store',
    'src/app/features/vendor/adapters/vendor',
    'src/app/features/vendor/guards/vendor',
    'src/app/features/vendor/services/client',
    'src/app/features/vendor/services/vendor-order',
    'src/app/features/vendor/services/vendor-product',
  ],
};

/** Claves aceptadas para una suite (para validar el propio baseline). */
export function baselineFor(suiteId) {
  return new Set(baseline[suiteId] ?? []);
}
