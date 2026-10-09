import { adaptCartFromBackend } from './cart.adapter';
import { CART_DIRECT_FIXTURE, CART_ENVELOPE_FIXTURE } from './fixtures/cart.fixture';

// R-C-8: contrato contra un fixture realista versionado en el repo, no contra
// el backend en vivo. Si el shape cambia, el fixture cambia en el mismo PR.
describe('cart.contract', () => {
  it('debe normalizar el carrito envuelto en { data } (snake_case y string numérico)', () => {
    const items = adaptCartFromBackend(CART_ENVELOPE_FIXTURE);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      quantity: 2,
      product: {
        id: 'of-1',
        name: 'Teclado Mecánico',
        price: 299.9,
        stock: 5,
        category: 'General',
      },
    });
    expect(items[1].product).toMatchObject({ id: '2', name: 'Mouse Gamer', price: 50, stock: 0 });
  });

  it('debe normalizar el carrito directo (sin envelope)', () => {
    const items = adaptCartFromBackend(CART_DIRECT_FIXTURE);

    expect(items).toHaveLength(1);
    expect(items[0].product).toMatchObject({ id: 'of-9', name: 'Mousepad XL', price: 20 });
  });
});
