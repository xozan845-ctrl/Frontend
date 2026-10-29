import {
  adaptCatalogProductFromBackend,
  adaptCatalogProductPageFromBackend,
} from './catalog-product.adapter';
import {
  CATALOG_PRODUCT_FIXTURE,
  CATALOG_PRODUCTS_PAGE_FIXTURE,
} from '../fixtures/catalog-product.fixture';

// R-C-8: contrato contra `ProductoResponseDto` y `PaginaProductosResponseDto`.
describe('catalog-product.contract', () => {
  it('normaliza el producto del catálogo', () => {
    expect(adaptCatalogProductFromBackend(CATALOG_PRODUCT_FIXTURE)).toMatchObject({
      id: CATALOG_PRODUCT_FIXTURE.id,
      companyId: CATALOG_PRODUCT_FIXTURE.empresa_id,
      sku: 'SKU-001',
      name: 'Teclado Mecánico',
      basePrice: 1000,
      stock: 10,
      createdAt: CATALOG_PRODUCT_FIXTURE.creado_en,
    });
  });

  it('normaliza la página y sus metadatos', () => {
    expect(adaptCatalogProductPageFromBackend(CATALOG_PRODUCTS_PAGE_FIXTURE)).toMatchObject({
      total: 12,
      page: 1,
      limit: 10,
      pages: 2,
    });
  });
});
