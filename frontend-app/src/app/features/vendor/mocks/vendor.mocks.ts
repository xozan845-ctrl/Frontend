import { Client, OrderLine, VendorOrder, VendorProduct } from '../models/vendor-order.model';

/**
 * Datos demo del panel del vendedor (`dataSource: 'mock'`, R-EN-2): catálogo,
 * clientes y pedidos coherentes con el diseño del POS. Los pedidos se generan
 * con fechas relativas a hoy para que "recientes" y los KPIs del inicio tengan
 * datos en cualquier fecha de ejecución (tests y E2E incluidos).
 */

const SHAMPOO: VendorProduct = {
  id: 'vp-1',
  name: 'KPBM Shampoo Keratina',
  sku: 'KPBM-001',
  category: 'Cuidado capilar',
  price: 180,
  imageUrl: '',
  inStock: true,
};

const MASCARILLA: VendorProduct = {
  id: 'vp-2',
  name: 'Salon Plus Mascarilla',
  sku: 'SP-002',
  category: 'Cuidado capilar',
  price: 220,
  imageUrl: '',
  inStock: true,
};

const CAMELIA: VendorProduct = {
  id: 'vp-3',
  name: 'Camelia Oil Tratamiento',
  sku: 'CAM-003',
  category: 'Tratamientos',
  price: 195,
  imageUrl: '',
  inStock: true,
};

const KOLESCREM: VendorProduct = {
  id: 'vp-4',
  name: 'Kolescrem Crema Profesional',
  sku: 'KOL-004',
  category: 'Cremas',
  price: 150,
  imageUrl: '',
  inStock: true,
};

const TINTE: VendorProduct = {
  id: 'vp-5',
  name: 'Tinte Profesional 6.1',
  sku: 'TIN-005',
  category: 'Tintes',
  price: 120,
  imageUrl: '',
  inStock: true,
};

const ACONDICIONADOR: VendorProduct = {
  id: 'vp-6',
  name: 'KPBM Acondicionador',
  sku: 'KPBM-006',
  category: 'Cuidado capilar',
  price: 180,
  imageUrl: '',
  inStock: false,
};

export const MOCK_VENDOR_PRODUCTS: readonly VendorProduct[] = [
  SHAMPOO,
  MASCARILLA,
  CAMELIA,
  KOLESCREM,
  TINTE,
  ACONDICIONADOR,
];

export const MOCK_CLIENTS: readonly Client[] = [
  {
    id: 'vc-1',
    code: 'CL-00125',
    name: 'Carla López',
    phone: '+505 8765 4321',
    email: 'carla.lopez@correo.com',
  },
  {
    id: 'vc-2',
    code: 'CL-00124',
    name: 'Distribuidora Kemuel',
    phone: '+505 2222 3333',
    email: 'ventas@kemuel.com',
  },
  {
    id: 'vc-3',
    code: 'CL-00123',
    name: 'Estética Bella',
    phone: '+505 8888 1212',
    email: 'hola@esteticabella.com',
  },
];

/** Línea de pedido a partir de un producto del catálogo demo. */
function line(product: VendorProduct, quantity: number): OrderLine {
  return {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    unitPrice: product.price,
    quantity,
  };
}

/** Fecha ISO 8601 UTC de `daysAgo` a la hora local indicada. */
function at(now: Date, daysAgo: number, hours: number, minutes: number): string {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

/**
 * Pedidos demo con fechas relativas a hoy. Totales coherentes con
 * subtotal × (1 + IVA 15 %) y los cuatro estados del dominio representados.
 */
export function buildMockVendorOrders(now: Date = new Date()): VendorOrder[] {
  return [
    {
      id: 'PED-000125',
      clientId: 'vc-1',
      clientName: 'Carla López',
      createdAt: at(now, 0, 10, 32),
      status: 'en_proceso',
      total: 1339.75,
      lines: [line(SHAMPOO, 2), line(MASCARILLA, 1), line(CAMELIA, 3)],
      notes: '',
    },
    {
      id: 'PED-000124',
      clientId: 'vc-2',
      clientName: 'Distribuidora Kemuel',
      createdAt: at(now, 1, 16, 5),
      status: 'completado',
      total: 2415,
      lines: [line(TINTE, 10), line(KOLESCREM, 6)],
      notes: 'Facturar a 30 días.',
    },
    {
      id: 'PED-000123',
      clientId: 'vc-3',
      clientName: 'Estética Bella',
      createdAt: at(now, 2, 9, 45),
      status: 'pendiente',
      total: 920,
      lines: [line(MASCARILLA, 2), line(TINTE, 3)],
      notes: '',
    },
    {
      id: 'PED-000122',
      clientId: null,
      clientName: 'Cliente ocasional',
      createdAt: at(now, 3, 12, 15),
      status: 'cancelado',
      total: 690,
      lines: [line(KOLESCREM, 4)],
      notes: 'El cliente no confirmó.',
    },
  ];
}
