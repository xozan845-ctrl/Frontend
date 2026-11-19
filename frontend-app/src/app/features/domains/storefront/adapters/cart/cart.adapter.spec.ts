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

  it('debe dejar el total como null cuando el backend no lo envía', () => {
    const snapshot = adaptCartFromBackend({
      items: [{ oferta_id: 'of-2', cantidad: 2, precio_venta: 5 }],
    });

    expect(snapshot.total).toBeNull();
    expect(snapshot.expiresAt).toBeNull();
  });

  it('debe conservar el total cero cuando el backend lo envía como número', () => {
    const snapshot = adaptCartFromBackend({
      items: [{ oferta_id: 'of-4', cantidad: 1, precio_venta: 100 }],
      total: 0,
    });

    expect(snapshot.total).toBe(0);
  });

  it('debe conservar el total cero cuando el backend lo envía como string', () => {
    const snapshot = adaptCartFromBackend({
      data: {
        items: [{ oferta_id: 'of-5', cantidad: 1, precio_venta: 100 }],
        total: '0.00',
      },
    });

    expect(snapshot.total).toBe(0);
  });

  it('debe devolver total null cuando el backend envía un valor inválido', () => {
    for (const total of ['', 'abc', -1, Number.NaN, Number.POSITIVE_INFINITY, null]) {
      expect(adaptCartFromBackend({ items: [], total }).total).toBeNull();
    }
  });

  it('debe normalizar dos formatos externos al mismo snapshot cuando el total es cero', () => {
    const items = [{ oferta_id: 'of-6', cantidad: 2, precio_venta: 100 }];
    const direct = adaptCartFromBackend({ items, total: 0 });
    const envelope = adaptCartFromBackend({ data: { items, total: '0.00' } });

    expect(direct.total).toBe(0);
    expect(envelope.total).toBe(0);
    expect(envelope).toEqual(direct);
  });

  it('debe normalizar dos formatos externos al mismo snapshot cuando falta el total', () => {
    const items = [{ oferta_id: 'of-7', cantidad: 2, precio_venta: 100 }];
    const direct = adaptCartFromBackend({ items });
    const envelope = adaptCartFromBackend({ data: { items } });

    expect(direct.total).toBeNull();
    expect(envelope.total).toBeNull();
    expect(envelope).toEqual(direct);
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
      expect(adaptCartFromBackend(response)).toEqual({ items: [], total: null, expiresAt: null });
    }
  });
});
