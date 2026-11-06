/** API pública del dominio de catálogo maestro (`R-CX-6`). */
export {
  CATALOG_PRODUCT_REPOSITORY,
  type CatalogProductRepository,
} from './repositories/catalog-product.repository';
export { CatalogProductService } from './services/catalog-product/catalog-product.service';
export { adaptCatalogProductFromBackend } from './adapters/catalog-product/catalog-product.adapter';
export type { BackendCatalogProductDTO } from './models/catalog-product.dto';
export type {
  CatalogProduct,
  CatalogProductFilters,
  CatalogProductPage,
  CatalogProductStatus,
  CreateCatalogProductData,
  UpdateCatalogProductData,
} from './models/catalog-product.model';
