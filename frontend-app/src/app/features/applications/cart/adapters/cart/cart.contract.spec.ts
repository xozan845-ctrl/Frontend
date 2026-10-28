import { adaptCartFromBackend } from './cart.adapter';
import { CART_DIRECT_FIXTURE, CART_ENVELOPE_FIXTURE } from '../fixtures/cart.fixture';

// R-C-8: contrato contra un fixture realista versionado en el repo, no contra
// el backend en vivo. Si el shape cambia, el fixture cambia en el mismo PR.
describe('cart.contract', () => {
  it('debe normalizar CarritoResponseDto envuelto en { data }', () => {
    const snapshot = adaptCartFromBackend(CART_ENVELOPE_FIXTURE);

    expect(snapshot.total).toBe(649.8);
    expect(snapshot.expiresAt).toBe('2026-10-10T00:00:00Z');
    expect(snapshot.items).toHaveLength(2);
    expect(snapshot.items[0]).toMatchObject({
      offerId: 'of-1',
      storeId: 't-1',
      sellerId: 'v-1',
      sku: 'SKU-TEC',
      status: 'activa',
      quantity: 2,
      product: { id: 'of-1', name: 'Teclado Mecánico', price: 299.9, stock: 5 },
    });
    expect(snapshot.items[1].product).toMatchObject({ id: '2', name: 'Mouse Gamer', price: 50 });
  });

  it('debe normalizar el carrito directo (sin envelope)', () => {
    const snapshot = adaptCartFromBackend(CART_DIRECT_FIXTURE);

    expect(snapshot.total).toBe(60);
    expect(snapshot.expiresAt).toBeNull();
    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0].product).toMatchObject({
      id: 'of-9',
      name: 'Mousepad XL',
      price: 20,
    });
  });
});
