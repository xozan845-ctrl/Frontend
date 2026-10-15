import {
  adaptClientFromBackend,
  adaptClientsFromBackend,
  adaptOrderFromBackend,
  adaptOrdersFromBackend,
  adaptVendorProductFromBackend,
  adaptVendorProductsFromBackend,
  normalizeOrderStatus,
} from './vendor.adapter';

describe('vendor.adapter', () => {
  describe('normalizeOrderStatus', () => {
    it('debe normalizar alias, mayúsculas y espacios', () => {
      expect(normalizeOrderStatus('PENDIENTE')).toBe('pendiente');
      expect(normalizeOrderStatus('En Proceso')).toBe('en_proceso');
      expect(normalizeOrderStatus('completada')).toBe('completado');
      expect(normalizeOrderStatus('Cancelada')).toBe('cancelado');
    });

    it('debe caer a pendiente con valores inválidos', () => {
      expect(normalizeOrderStatus(undefined)).toBe('pendiente');
      expect(normalizeOrderStatus(7)).toBe('pendiente');
      expect(normalizeOrderStatus('')).toBe('pendiente');
      expect(normalizeOrderStatus('aprobado')).toBe('pendiente');
    });
  });

  describe('adaptOrderFromBackend', () => {
    it('debe devolver null cuando no hay objeto ni id', () => {
      expect(adaptOrderFromBackend(null)).toBeNull();
      expect(adaptOrderFromBackend('un pedido')).toBeNull();
      expect(adaptOrderFromBackend({ cliente_nombre: 'Sin id' })).toBeNull();
    });

    it('debe tolerar líneas sin id (se descartan) y precios/cantidades inválidos', () => {
      const order = adaptOrderFromBackend({
        id: 'PED-1',
        items: [
          { nombre: 'Producto sin id' },
          { producto_id: 'p-9', cantidad: -3, precio: 'no-es-numero' },
        ],
      });

      expect(order?.lines).toEqual([
        { productId: 'p-9', name: 'Producto', sku: '', unitPrice: 0, quantity: 1 },
      ]);
    });

    it('debe descartar líneas que no son objetos y usar `precio_unitario`', () => {
      const order = adaptOrderFromBackend({
        id: 'PED-4',
        items: ['texto', null, { producto_id: 'p-1', precio_unitario: '99.90', cantidad: 'dos' }],
      });

      expect(order?.lines).toEqual([
        { productId: 'p-1', name: 'Producto', sku: '', unitPrice: 99.9, quantity: 1 },
      ]);
    });

    it('debe usar `cliente_id` suelto cuando no viene el objeto cliente', () => {
      const order = adaptOrderFromBackend({ id: 'PED-2', cliente_id: 9 });

      expect(order?.clientId).toBe('9');
      expect(order?.clientName).toBe('Cliente ocasional');
      expect(order?.lines).toEqual([]);
      expect(order?.notes).toBe('');
    });

    it('debe preferir el nombre del objeto cliente y aceptar notas', () => {
      const order = adaptOrderFromBackend({
        id: 'PED-3',
        cliente: { id: 'cl-9', nombre: 'Salón Vero' },
        notas: 'Pago en efectivo',
      });

      expect(order?.clientName).toBe('Salón Vero');
      expect(order?.notes).toBe('Pago en efectivo');
    });
  });

  describe('adaptClientFromBackend', () => {
    it('debe devolver null sin id y usar correo alternativo', () => {
      expect(adaptClientFromBackend({ codigo: 'CL-1', nombre: 'Sin id' })).toBeNull();
      expect(adaptClientFromBackend('cliente')).toBeNull();
      expect(adaptClientFromBackend({ id: 5, correo: 'a@b.com' })).toEqual({
        id: '5',
        code: '',
        name: 'Cliente',
        phone: '',
        email: 'a@b.com',
      });
    });
  });

  describe('adaptVendorProductFromBackend', () => {
    it('debe derivar `inStock` de disponible, stock o asumir disponible', () => {
      expect(adaptVendorProductFromBackend({ id: 'p', disponible: false })?.inStock).toBe(false);
      expect(adaptVendorProductFromBackend({ id: 'p', stock: 0 })?.inStock).toBe(false);
      expect(adaptVendorProductFromBackend({ id: 'p' })?.inStock).toBe(true);
    });

    it('debe devolver null sin id y normalizar precio decimal', () => {
      expect(adaptVendorProductFromBackend({ precio: 100 })).toBeNull();
      expect(adaptVendorProductFromBackend('producto')).toBeNull();
      expect(adaptVendorProductFromBackend({ id: 'p', precio: '12,5' })?.price).toBe(12.5);
    });
  });

  describe('listas', () => {
    it('debe tolerar respuestas vacías o que no son lista', () => {
      expect(adaptOrdersFromBackend(null)).toEqual([]);
      expect(adaptOrdersFromBackend({ data: 'no-es-lista' })).toEqual([]);
      expect(adaptClientsFromBackend(undefined)).toEqual([]);
      expect(adaptVendorProductsFromBackend({})).toEqual([]);
    });

    it('debe aceptar arrays directos y envelopes { data }', () => {
      expect(adaptOrdersFromBackend([{ id: 'PED-1' }])).toHaveLength(1);
      expect(adaptClientsFromBackend({ data: [{ id: 'cl-1' }] })).toHaveLength(1);
      expect(adaptVendorProductsFromBackend([{ id: 'p-1' }, { sin: 'id' }])).toHaveLength(1);
    });
  });
});
