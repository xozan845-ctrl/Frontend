/**
 * API de aplicación pública de `products` para dominios consumidores.
 * Expone modelos y stores; no importar sus rutas internas desde otro dominio.
 */
export type { Product, ProductVariant } from './models/product.model';
export type { Store } from './models/store.model';
export { ProductStore } from './state/product/product.store';
export { ReviewsStore } from './state/reviews/reviews.store';
export { CatalogProductsStore } from './state/catalog-product/catalog-product.store';
export {
  CATALOG_PRODUCT_REPOSITORY,
  CatalogProductService,
  adaptCatalogProductFromBackend,
  type BackendCatalogProductDTO,
  type CatalogProduct,
  type CatalogProductFilters,
  type CatalogProductPage,
  type CatalogProductStatus,
  type CatalogProductRepository,
  type CreateCatalogProductData,
  type UpdateCatalogProductData,
} from '../../domains/catalog/public-api';
