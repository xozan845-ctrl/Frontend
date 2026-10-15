import {
  adaptClientFromBackend,
  adaptClientsFromBackend,
  adaptOrderFromBackend,
  adaptOrdersFromBackend,
  adaptVendorProductFromBackend,
  adaptVendorProductsFromBackend,
} from './vendor.adapter';
import {
  CLIENTE_ENVELOPE_FIXTURE,
  CLIENTES_DIRECT_FIXTURE,
  PEDIDO_ENVELOPE_FIXTURE,
  PEDIDOS_ITEMS_FIXTURE,
  PRODUCTO_VENDEDOR_FIXTURE,
  PRODUCTOS_VENDEDOR_ENVELOPE_FIXTURE,
} from './fixtures/vendor.fixture';

// R-C-8: contrato contra fixtures realistas versionados en el repo, no contra
// el backend en vivo. Si el shape cambia, los fixtures cambian en el mismo PR.
describe('vendor.contract', () => {
  it('debe normalizar el pedido envuelto en { data } (snake_case, id numérico, total string)', () => {
    expect(adaptOrderFromBackend(PEDIDO_ENVELOPE_FIXTURE)).toEqual({
      id: '125',
      clientId: 'cl-1',
      clientName: 'Carla López',
      createdAt: '2026-10-15T10:32:00Z',
      status: 'en_proceso',
      total: 1339.75,
      lines: [
        {
          productId: 'p-1',
          name: 'KPBM Shampoo Keratina',
          sku: 'KPBM-001',
          unitPrice: 180,
          quantity: 2,
        },
        {
          productId: '2',
          name: 'Salon Plus Mascarilla',
          sku: 'SP-002',
          unitPrice: 220.5,
          quantity: 1,
        },
      ],
      notes: 'Entregar por la tarde',
    });
  });

  it('debe normalizar la lista con envelope { items } y sus bordes', () => {
    expect(adaptOrdersFromBackend(PEDIDOS_ITEMS_FIXTURE)).toEqual([
      {
        id: 'PED-000123',
        clientId: null,
        clientName: 'Estética Bella',
        createdAt: '2026-10-14T18:05:00Z',
        status: 'pendiente',
        total: 920,
        lines: [],
        notes: '',
      },
      {
        id: 'PED-000122',
        clientId: null,
        clientName: 'Cliente ocasional',
        createdAt: '',
        status: 'pendiente',
        total: 0,
        lines: [],
        notes: '',
      },
    ]);
  });

  it('debe normalizar el cliente envuelto en { data } con correo alternativo', () => {
    expect(adaptClientFromBackend(CLIENTE_ENVELOPE_FIXTURE)).toEqual({
      id: '42',
      code: 'CL-000042',
      name: 'Distribuidora Kemuel',
      phone: '+505 2222 3333',
      email: 'ventas@kemuel.com',
    });
  });

  it('debe normalizar la lista directa de clientes y descartar los que no tienen id', () => {
    expect(adaptClientsFromBackend(CLIENTES_DIRECT_FIXTURE)).toEqual([
      {
        id: 'vc-3',
        code: '',
        name: 'Carla López',
        phone: '+505 8765 4321',
        email: 'carla@correo.com',
      },
    ]);
  });

  it('debe normalizar el producto directo (stock) y el catálogo (disponible)', () => {
    expect(adaptVendorProductFromBackend(PRODUCTO_VENDEDOR_FIXTURE)).toEqual({
      id: '7',
      name: 'Camelia Oil Tratamiento',
      sku: 'CAM-007',
      category: 'Tratamientos',
      price: 195,
      imageUrl: '',
      inStock: true,
    });

    expect(adaptVendorProductsFromBackend(PRODUCTOS_VENDEDOR_ENVELOPE_FIXTURE)).toEqual([
      {
        id: 'p-8',
        name: 'Kolescrem',
        sku: 'KOL-008',
        category: 'Cremas',
        price: 150,
        imageUrl: '',
        inStock: false,
      },
    ]);
  });
});
