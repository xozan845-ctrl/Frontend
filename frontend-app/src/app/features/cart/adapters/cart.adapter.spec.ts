import { adaptCartFromBackend } from './cart.adapter';

describe('cart.adapter', () => {
  it('debe mapear los items cuando llegan en snake_case con precio string', () => {
    const items = adaptCartFromBackend({
      items: [
        {
          oferta_id: 'of-1',
          cantidad: 2,
          producto_nombre: 'Teclado',
          precio_venta: '10.50',
          stock: 3,
          sku: 'SKU-TEC',
        },
      ],
    });

    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
    expect(items[0].product).toMatchObject({
      id: 'of-1',
      name: 'Teclado',
      description: 'SKU SKU-TEC',
      price: 10.5,
      category: 'General',
      stock: 3,
    });
  });

  it('debe desenvolver el envelope { data }', () => {
    const items = adaptCartFromBackend({ data: { items: [{ oferta_id: 'of-2', cantidad: 1 }] } });

    expect(items).toHaveLength(1);
    expect(items[0].product.id).toBe('of-2');
  });

  it('debe usar el id alternativo cuando no hay oferta_id', () => {
    const [item] = adaptCartFromBackend({ items: [{ id: 'x-1', cantidad: 1 }] });

    expect(item.product.id).toBe('x-1');
  });

  it('debe aplicar fallbacks cuando faltan campos', () => {
    const [item] = adaptCartFromBackend({ items: [{ oferta_id: 'of-3' }] });

    expect(item.product.name).toBe('Producto');
    expect(item.product.price).toBe(0);
    expect(item.product.stock).toBe(0);
    expect(item.quantity).toBe(1);
  });

  it('debe devolver un arreglo vacío cuando no hay items válidos', () => {
    expect(adaptCartFromBackend(null)).toEqual([]);
    expect(adaptCartFromBackend(undefined)).toEqual([]);
    expect(adaptCartFromBackend({})).toEqual([]);
    expect(adaptCartFromBackend({ items: 'no-es-array' })).toEqual([]);
    expect(adaptCartFromBackend('texto')).toEqual([]);
  });
});
