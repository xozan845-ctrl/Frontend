/**
 * API de aplicación pública de `products` para dominios consumidores.
 * Expone el storefront y el catálogo administrable; no importar sus rutas
 * internas desde otro dominio.
 */
export type { Product, ProductVariant } from '../../domains/storefront/public-api';
export type { Store } from '../../domains/storefront/public-api';
export { ProductStore } from '../../domains/storefront/public-api';
export { ReviewsStore } from '../../domains/storefront/public-api';
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
