import { adaptOrderResponse, generateMockOrderResponse } from './order.adapter';

describe('order.adapter', () => {
  describe('adaptOrderResponse', () => {
    it('debe generar una orden simulada cuando la respuesta no es válida', () => {
      const order = adaptOrderResponse(null, 150);

      expect(order.status).toBe('confirmed');
      expect(order.total).toBe(150);
      expect(order.orderNumber).toMatch(/^ORD-/);
    });

    it('debe mapear una orden en camelCase', () => {
      const order = adaptOrderResponse(
        {
          id: 'o-1',
          orderNumber: 'ORD-777',
          status: 'pending',
          total: 200,
          createdAt: '2026-01-02T03:04:05.000Z',
        },
        0,
      );

      expect(order).toEqual({
        id: 'o-1',
        orderNumber: 'ORD-777',
        status: 'pending',
        total: 200,
        createdAt: '2026-01-02T03:04:05.000Z',
      });
    });

    it('debe mapear una orden en snake_case y anidada en data', () => {
      const order = adaptOrderResponse(
        {
          data: { order_number: 'ORD-888', amount: '99.9', created_at: '2026-01-01T00:00:00.000Z' },
        },
        0,
      );

      expect(order.orderNumber).toBe('ORD-888');
      expect(order.total).toBeCloseTo(99.9, 2);
      expect(order.status).toBe('creada');
    });

    it('debe usar el total de respaldo cuando la respuesta no lo trae', () => {
      const order = adaptOrderResponse({}, 42);

      expect(order.total).toBe(42);
    });
  });

  describe('generateMockOrderResponse', () => {
    it('debe generar una orden consistente con el total indicado', () => {
      const order = generateMockOrderResponse(310);

      expect(order.total).toBe(310);
      expect(order.status).toBe('confirmed');
      expect(order.id).toMatch(/^ord-/);
      expect(order.orderNumber).toMatch(/^ORD-/);
      expect(() => new Date(order.createdAt).toISOString()).not.toThrow();
    });
  });
});
