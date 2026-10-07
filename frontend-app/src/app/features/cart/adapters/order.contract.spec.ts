import { adaptOrderResponse } from './order.adapter';
import { ORDER_CREATED_ENVELOPE_FIXTURE } from './fixtures/order.fixture';

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
});
