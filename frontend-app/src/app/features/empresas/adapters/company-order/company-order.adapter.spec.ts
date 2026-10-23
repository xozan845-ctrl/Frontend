import { adaptCompanyOrdersFromBackend } from './company-order.adapter';

const ORDERS_FIXTURE = [
  {
    id: 'o-1',
    estado: 'pagada',
    total_cents: 230000,
    comision_cents: 27600,
    moneda: 'C$',
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
  },
];

describe('company-order.adapter', () => {
  it('debe normalizar las órdenes de la empresa', () => {
    const orders = adaptCompanyOrdersFromBackend(ORDERS_FIXTURE);

    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: 'o-1',
      status: 'pagada',
      total: 2300,
      storeId: 'tienda-1',
    });
    expect(orders[0].items?.[0]).toMatchObject({ name: 'Teclado', quantity: 2 });
  });

  it('debe tolerar envelopes y listas vacías', () => {
    expect(adaptCompanyOrdersFromBackend({ data: ORDERS_FIXTURE })).toHaveLength(1);
    expect(adaptCompanyOrdersFromBackend(null)).toEqual([]);
  });
});
