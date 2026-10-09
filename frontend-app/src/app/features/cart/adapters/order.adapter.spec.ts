import {
  adaptOrderListFromBackend,
  adaptOrderResponse,
  adaptOrderTimelineFromBackend,
  generateMockOrderResponse,
} from './order.adapter';

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

    it('debe usar _id y derivar el orderNumber cuando faltan', () => {
      const order = adaptOrderResponse({ _id: 'abcdef123' }, 0);

      expect(order.id).toBe('abcdef123');
      expect(order.orderNumber).toMatch(/^ORD-/);
    });

    it('debe mapear items en camelCase con unit_price y storeId', () => {
      const order = adaptOrderResponse(
        {
          id: 'o-1',
          items: [{ ofertaId: 'of-9', quantity: 2, unit_price: '12.5', storeId: 't-9' }],
        },
        0,
      );

      expect(order.items?.[0]).toMatchObject({
        ofertaId: 'of-9',
        quantity: 2,
        unitPrice: 12.5,
        storeId: 't-9',
      });
    });

    it('debe mapear precio_unitario (sin centavos) y dejar items indefinidos', () => {
      expect(
        adaptOrderResponse({ id: 'o-1', items: [{ precio_unitario: 30 }] }, 0).items?.[0].unitPrice,
      ).toBe(30);
      expect(adaptOrderResponse({ id: 'o-1' }, 0).items).toBeUndefined();
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

  describe('adaptOrderListFromBackend', () => {
    it('debe normalizar un arreglo o un envelope', () => {
      expect(adaptOrderListFromBackend([{ id: 'o-1' }])).toHaveLength(1);
      expect(adaptOrderListFromBackend({ items: [{ id: 'o-1' }, { id: 'o-2' }] })).toHaveLength(2);
      expect(adaptOrderListFromBackend(null)).toEqual([]);
    });
  });

  describe('adaptOrderTimelineFromBackend', () => {
    it('debe mapear los eventos del timeline', () => {
      const timeline = adaptOrderTimelineFromBackend([
        { id: 1, tipo: 'orden.creada', payload: { a: 1 }, version: 1, creado_en: '2026-01-01' },
      ]);

      expect(timeline[0]).toMatchObject({ id: 1, type: 'orden.creada', version: 1 });
    });

    it('debe tolerar respuestas no válidas', () => {
      expect(adaptOrderTimelineFromBackend(null)).toEqual([]);
    });

    it('debe mapear camelCase y tolerar entradas nulas', () => {
      const timeline = adaptOrderTimelineFromBackend([
        { id: '5', type: 'x', createdAt: '2026' },
        null,
      ]);

      expect(timeline[0]).toMatchObject({ id: 5, type: 'x', version: 0, createdAt: '2026' });
      expect(timeline[1]).toMatchObject({ id: 0, type: 'evento', version: 0 });
    });
  });
});
