import {
  adaptCatalogProductFromBackend,
  adaptCatalogProductPageFromBackend,
} from './catalog-product.adapter';
import {
  CATALOG_PRODUCT_FIXTURE,
  CATALOG_PRODUCTS_PAGE_FIXTURE,
} from '../fixtures/catalog-product.fixture';

describe('catalog-product.adapter', () => {
  it('debe devolver null sin id o con entrada inválida', () => {
    expect(adaptCatalogProductFromBackend(null)).toBeNull();
    expect(adaptCatalogProductFromBackend('texto')).toBeNull();
    expect(adaptCatalogProductFromBackend({ nombre: 'Sin id' })).toBeNull();
  });

  it('debe normalizar snake_case, precios decimales y estado', () => {
    expect(adaptCatalogProductFromBackend(CATALOG_PRODUCT_FIXTURE)).toEqual({
      id: 'c13a201e-060e-4f05-87ae-2e24871b95b2',
      companyId: 'dfe0cfe4-8ddc-42bf-8dd2-6c3cb43544b3',
      sku: 'SKU-001',
      name: 'Teclado Mecánico',
      description: 'Teclado con switches táctiles.',
      category: 'Periféricos',
      basePrice: 1000,
      stock: 10,
      status: 'disponible',
      createdAt: '2026-10-21T00:00:00.000Z',
      parentProductId: null,
      attributes: {},
      hasVariants: false,
      images: [],
      variants: [],
      priceFrom: null,
      totalStock: null,
    });
  });

  it('debe usar valores por defecto cuando faltan campos', () => {
    expect(adaptCatalogProductFromBackend({ id: 'p-3' })).toEqual({
      id: 'p-3',
      companyId: '',
      sku: '',
      name: 'Producto',
      description: '',
      category: '',
      basePrice: 0,
      stock: 0,
      status: 'disponible',
      createdAt: '',
      parentProductId: null,
      attributes: {},
      hasVariants: false,
      images: [],
      variants: [],
      priceFrom: null,
      totalStock: null,
    });
  });

  it('debe normalizar la página con metadatos en texto', () => {
    const page = adaptCatalogProductPageFromBackend(CATALOG_PRODUCTS_PAGE_FIXTURE);

    expect(page.total).toBe(12);
    expect(page.page).toBe(1);
    expect(page.limit).toBe(10);
    expect(page.pages).toBe(2);
    expect(page.items).toHaveLength(2);
    expect(page.items[1]).toMatchObject({ status: 'agotado', stock: 0 });
  });

  it('debe adaptar imágenes, variantes y URLs de storage del backend real', () => {
    const product = adaptCatalogProductFromBackend(
      {
        id: 'p-1',
        empresa_id: 'empresa-1',
        sku: 'SKU-1',
        nombre: 'Teclado',
        precio_base: '100.00',
        stock: 3,
        estado: 'disponible',
        atributos: { marca: 'KBC' },
        imagenes: [
          {
            id: 'img-1',
            objeto_id: 'obj-1',
            url: '/api/v1/storage/public/objetos/obj-1',
            orden: 0,
            es_principal: true,
          },
        ],
        tiene_variantes: true,
        precio_desde: '100.00',
        stock_total: 3,
        variantes: [
          {
            id: 'v-1',
            producto_padre_id: 'p-1',
            sku: 'SKU-1-RED',
            nombre: 'Rojo',
            atributos: { color: 'rojo' },
            precio_base: '110.00',
            stock: 3,
            estado: 'disponible',
            imagenes: [],
            creado_en: '2026-10-21T00:00:00.000Z',
          },
        ],
      },
      'https://api.test/api-proxy/api/v1',
    );

    expect(product).toMatchObject({
      companyId: 'empresa-1',
      attributes: { marca: 'KBC' },
      hasVariants: true,
      priceFrom: 100,
      totalStock: 3,
    });
    expect(product?.images?.[0]).toEqual({
      id: 'img-1',
      objectId: 'obj-1',
      url: 'https://api.test/api-proxy/api/v1/storage/public/objetos/obj-1',
      order: 0,
      isPrimary: true,
    });
    expect(product?.variants?.[0]).toMatchObject({
      id: 'v-1',
      parentProductId: 'p-1',
      sku: 'SKU-1-RED',
      name: 'Rojo',
      basePrice: 110,
      stock: 3,
    });
  });

  it('debe tolerar array directo y respuesta vacía', () => {
    expect(adaptCatalogProductPageFromBackend([{ id: 'p-1' }]).items).toHaveLength(1);
    expect(adaptCatalogProductPageFromBackend({})).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      pages: 1,
    });
  });
});
