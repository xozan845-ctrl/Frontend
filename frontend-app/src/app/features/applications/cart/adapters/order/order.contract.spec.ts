import { adaptOrderResponse } from './order.adapter';
import { ORDER_CREATED_ENVELOPE_FIXTURE, ORDER_VIEW_FIXTURE } from '../fixtures/order.fixture';

// R-C-8: contrato contra fixture versionado, no contra el backend en vivo.
describe('order.contract', () => {
  it('debe normalizar la orden envuelta en data', () => {
    const order = adaptOrderResponse(ORDER_CREATED_ENVELOPE_FIXTURE, 0);

    expect(order).toMatchObject({
      id: 'ord_9f2a',
      orderNumber: 'ORD-000042',
      status: 'shipped',
      total: 1299.5,
    });
  });

  it('debe conservar la fecha ISO 8601 UTC del backend (R-C-4)', () => {
    const order = adaptOrderResponse(ORDER_CREATED_ENVELOPE_FIXTURE, 0);

    expect(order.createdAt).toBe('2026-10-01T15:04:05Z');
  });

  it('debe caer al total de respaldo cuando el backend no lo envía', () => {
    const order = adaptOrderResponse({ data: { id: 'ord_1' } }, 75.25);

    expect(order.total).toBe(75.25);
  });

  it('debe normalizar OrderViewResponseDto con contexto, comisión y fechas', () => {
    const order = adaptOrderResponse(ORDER_VIEW_FIXTURE, 0);

    expect(order).toMatchObject({
      id: '5f0e7b2c-9f61-4f0e-8d6a-2b7c1a9e4d11',
      status: 'pagada',
      total: 2300,
      commission: 276,
      currency: 'C$',
      buyerId: 'c-1',
      sellerId: 'v-1',
      storeId: 't-1',
      paidAt: '2026-10-22T15:05:00.000Z',
      items: [
        {
          ofertaId: 'of-1',
          sku: 'SKU-001',
          name: 'Teclado Mecánico',
          quantity: 2,
          unitPrice: 1150,
          storeId: 't-1',
        },
      ],
    });
  });
});
