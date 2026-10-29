/**
 * API de aplicación pública de `products` para dominios consumidores.
 * Expone modelos y stores; no importar sus rutas internas desde otro dominio.
 */
export type { Product, ProductVariant } from './models/product.model';
export type { Store } from './models/store.model';
export { ProductStore } from './state/product/product.store';
export { ReviewsStore } from './state/reviews/reviews.store';
export { CatalogProductsStore } from './state/catalog-product/catalog-product.store';
export { CATALOG_PRODUCT_REPOSITORY } from './repositories/catalog-product.repository';
export { CatalogProductService } from './services/catalog-product/catalog-product.service';
export type {
  CatalogProduct,
  CatalogProductImage,
  CatalogProductVariant,
  CatalogProductFilters,
  CatalogProductPage,
  CatalogProductStatus,
  CreateCatalogProductVariantData,
  CreateCatalogProductData,
  ProductImageData,
  UpdateCatalogProductVariantData,
  UpdateCatalogProductData,
} from './models/catalog-product.model';
