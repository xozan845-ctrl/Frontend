/**
 * API de aplicación pública de `products` para dominios consumidores.
 * Expone modelos y stores; no importar sus rutas internas desde otro dominio.
 */
export type { Product, ProductVariant } from './models/product.model';
export type { Store } from './models/store.model';
export { ProductStore } from './state/product.store';
export { ReviewsStore } from './state/reviews.store';
