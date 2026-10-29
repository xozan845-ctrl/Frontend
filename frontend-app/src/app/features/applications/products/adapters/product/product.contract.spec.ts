import {
  adaptProductListFromBackend,
  adaptSingleProductFromBackend,
  adaptStorefrontFromBackend,
} from './product.adapter';
import {
  PRODUCT_LIST_ENVELOPE_FIXTURE,
  PRODUCT_SINGLE_ENVELOPE_FIXTURE,
  TIENDA_PUBLICA_FIXTURE,
} from '../fixtures/product.fixture';

// R-C-8: test de contrato contra un fixture realista versionado en el repo,
// no contra el backend en vivo. Si el shape cambia, el fixture cambia en el PR.
describe('product.contract', () => {
  describe('adaptProductListFromBackend con envelope { data, meta }', () => {
    it('debe normalizar la lista al modelo de dominio', () => {
      const products = adaptProductListFromBackend(PRODUCT_LIST_ENVELOPE_FIXTURE);

      expect(products).toHaveLength(2);
    });

    it('debe mapear snake_case y tipos string numéricos del primer producto', () => {
      const [first] = adaptProductListFromBackend(PRODUCT_LIST_ENVELOPE_FIXTURE);

      expect(first).toMatchObject({
        id: 101,
        name: 'Auriculares Quantum X',
        price: 299.9,
        originalPrice: 349.9,
        imageUrl: 'https://cdn.example.com/products/auriculares-x.jpg',
        category: 'Audio',
        stock: 12,
      });
    });

    it('debe aplanar la categoría anidada y conservar la galería', () => {
      const [first] = adaptProductListFromBackend(PRODUCT_LIST_ENVELOPE_FIXTURE);

      expect(first.category).toBe('Audio');
      expect(first.images).toHaveLength(2);
    });

    it('debe mapear nombres alternativos del segundo producto', () => {
      const [, second] = adaptProductListFromBackend(PRODUCT_LIST_ENVELOPE_FIXTURE);

      expect(second).toMatchObject({
        id: 102,
        name: 'Teclado Mecánico Q',
        price: 149.5,
        imageUrl: 'https://cdn.example.com/products/teclado-q.jpg',
        category: 'Periféricos',
        stock: 0,
      });
    });
  });

  describe('adaptSingleProductFromBackend con envelope { data }', () => {
    it('debe normalizar el producto individual al modelo de dominio', () => {
      const product = adaptSingleProductFromBackend(PRODUCT_SINGLE_ENVELOPE_FIXTURE);

      expect(product).toMatchObject({
        id: 'sku-200',
        name: 'Monitor UltraWide 34',
        price: 899,
        imageUrl: 'https://cdn.example.com/products/monitor-uw.jpg',
        category: 'Monitores',
        stock: 5,
      });
    });
  });
});

describe('product.contract · tienda pública', () => {
  it('debe normalizar TiendaPublicaResponseDto a tienda + productos', () => {
    const storefront = adaptStorefrontFromBackend(TIENDA_PUBLICA_FIXTURE);

    expect(storefront.store).toEqual({
      id: 'dc81527d-78ae-4bbc-bf69-0d884186a29a',
      vendorId: 'e9aa395b-1654-48b0-befe-fbe38538a408',
      name: 'Tienda Ofertas',
      description: 'Productos de la empresa',
      companyId: 'dfe0cfe4-8ddc-42bf-8dd2-6c3cb43544b3',
      ownerUserId: 'e9aa395b-1654-48b0-befe-fbe38538a408',
      participationPercentage: 100,
      createdAt: '2026-10-21T21:20:00.000Z',
    });
    expect(storefront.products).toHaveLength(1);
    expect(storefront.products[0]).toMatchObject({
      id: 'be644b6e-ef1d-49d2-a79c-4077c2d77a07',
      name: 'Producto Oferta',
      price: 125,
      stock: 10,
    });
  });
});
