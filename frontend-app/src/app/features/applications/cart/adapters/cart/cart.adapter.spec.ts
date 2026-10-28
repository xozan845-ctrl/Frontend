import { adaptCartFromBackend } from './cart.adapter';

describe('cart.adapter', () => {
  it('debe mapear items, total y expiración en snake_case', () => {
    const snapshot = adaptCartFromBackend({
      items: [
        {
          oferta_id: 'of-1',
          id: 'of-1',
          tienda_id: 't-1',
          vendedor_id: 'v-1',
          cantidad: 2,
          producto_nombre: 'Teclado',
          precio_venta: '10.50',
          stock: 3,
          sku: 'SKU-TEC',
          estado: 'activa',
        },
      ],
      total: '21.00',
      expira_en: '2026-10-22T18:00:00.000Z',
    });

    expect(snapshot.total).toBe(21);
    expect(snapshot.expiresAt).toBe('2026-10-22T18:00:00.000Z');
    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0]).toMatchObject({
      offerId: 'of-1',
      storeId: 't-1',
      sellerId: 'v-1',
      sku: 'SKU-TEC',
      status: 'activa',
      quantity: 2,
      product: {
        id: 'of-1',
        name: 'Teclado',
        description: 'SKU SKU-TEC',
        price: 10.5,
        stock: 3,
      },
    });
  });

  it('debe derivar el total cuando el backend no lo envía', () => {
    const snapshot = adaptCartFromBackend({
      items: [{ oferta_id: 'of-2', cantidad: 2, precio_venta: 5 }],
    });

    expect(snapshot.total).toBe(10);
    expect(snapshot.expiresAt).toBeNull();
  });

  it('debe desenvolver el envelope { data }', () => {
    const snapshot = adaptCartFromBackend({
      data: { items: [{ oferta_id: 'of-3', cantidad: 1 }], total: '0.00' },
    });

    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0].product.id).toBe('of-3');
  });

  it('debe usar el id alternativo y aplicar fallbacks', () => {
    const snapshot = adaptCartFromBackend({ items: [{ id: 'x-1' }] });
    const [item] = snapshot.items;

    expect(item.product.id).toBe('x-1');
    expect(item.product.name).toBe('Producto');
    expect(item.product.price).toBe(0);
    expect(item.quantity).toBe(1);
    expect(item.status).toBeUndefined();
  });

  it('debe devolver un carrito vacío cuando no hay items válidos', () => {
    for (const response of [null, undefined, {}, { items: 'no-es-array' }, 'texto']) {
      expect(adaptCartFromBackend(response)).toEqual({ items: [], total: 0, expiresAt: null });
    }
  });
});
