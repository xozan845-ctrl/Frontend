import { adaptOrderFromBackend, adaptOrdersFromBackend } from './order.adapter';

const COMPANY_ORDER = {
  id: 'o-1',
  order_number: 'ORD-1',
  estado: 'pagada',
  total_cents: 230000,
  comision_cents: 27600,
  tienda_id: 'tienda-1',
  comprador_id: 'comprador-1',
  creado_en: '2026-10-22T15:00:00.000Z',
  items: [
    {
      oferta_id: 'of-1',
      sku: 'SKU-1',
      producto_nombre: 'Teclado',
      cantidad: 2,
      precio_unitario_cents: 115000,
      tienda_id: 'tienda-1',
    },
  ],
};

const VENDOR_ORDER = {
  id: 'PED-2',
  cliente: { id: 'cl-9', nombre: 'Salón Vero' },
  estado: 'En Proceso',
  total: '99.90',
  notas: 'Pago en efectivo',
  items: [
    { producto_id: 'p-1', nombre: 'Café', sku: 'CAF-1', precio: '49.95', cantidad: 2 },
    { nombre: 'Sin id' },
  ],
};

describe('order.adapter', () => {
  it('debe normalizar una orden de empresa con centavos y líneas', () => {
    expect(adaptOrderFromBackend(COMPANY_ORDER)).toEqual({
      id: 'o-1',
      number: 'ORD-1',
      buyerId: 'comprador-1',
      clientName: 'Cliente ocasional',
      createdAt: '2026-10-22T15:00:00.000Z',
      status: 'pagada',
      total: 2300,
      lines: [
        {
          productId: 'of-1',
          name: 'Teclado',
          sku: 'SKU-1',
          unitPrice: 1150,
          quantity: 2,
          storeId: 'tienda-1',
        },
      ],
      notes: '',
      storeId: 'tienda-1',
      commission: 276,
    });
  });

  it('debe normalizar una orden de vendedor, cliente anidado y notas', () => {
    const order = adaptOrderFromBackend(VENDOR_ORDER);

    expect(order).toMatchObject({
      id: 'PED-2',
      number: 'ORD-PED-2',
      clientId: 'cl-9',
      clientName: 'Salón Vero',
      status: 'En Proceso',
      total: 99.9,
      notes: 'Pago en efectivo',
    });
    expect(order?.lines).toEqual([
      { productId: 'p-1', name: 'Café', sku: 'CAF-1', unitPrice: 49.95, quantity: 2 },
    ]);
  });

  it('debe tolerar entradas inválidas y líneas sin producto', () => {
    expect(adaptOrderFromBackend(null)).toBeNull();
    expect(adaptOrderFromBackend('pedido')).toBeNull();
    expect(adaptOrderFromBackend({ cliente_nombre: 'Sin id' })).toBeNull();
    expect(
      adaptOrderFromBackend({
        id: 'PED-1',
        items: [
          { nombre: 'Producto sin id' },
          { producto_id: 'p-9', cantidad: -3, precio: 'no-es-numero' },
        ],
      })?.lines,
    ).toEqual([{ productId: 'p-9', name: 'Producto', sku: '', unitPrice: 0, quantity: 1 }]);
  });

  it('debe usar cliente_id suelto y total por defecto', () => {
    const order = adaptOrderFromBackend({ id: 'PED-3', cliente_id: 9 });

    expect(order).toMatchObject({
      clientId: '9',
      clientName: 'Cliente ocasional',
      total: 0,
      lines: [],
      notes: '',
    });
  });

  it('debe aceptar array, envelope data e items', () => {
    expect(adaptOrdersFromBackend([COMPANY_ORDER])).toHaveLength(1);
    expect(adaptOrdersFromBackend({ data: [COMPANY_ORDER] })).toHaveLength(1);
    expect(adaptOrdersFromBackend({ items: [VENDOR_ORDER] })).toHaveLength(1);
    expect(adaptOrdersFromBackend(null)).toEqual([]);
  });
});
