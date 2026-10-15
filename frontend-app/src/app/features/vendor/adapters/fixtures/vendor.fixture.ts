/**
 * Fixtures de contrato versionados (`R-C-8`) del backend asumido del vendedor
 * (ADR-20): envelope `{ data }`/`{ items }`, `snake_case`, ids numéricos,
 * precios como string y fechas ISO 8601 UTC. No se actualizan contra el
 * backend en vivo: si cambia el shape, cambian en el mismo PR.
 */

export const PEDIDO_ENVELOPE_FIXTURE = {
  data: {
    id: 125,
    cliente: {
      id: 'cl-1',
      codigo: 'CL-00125',
      nombre: 'Carla López',
      telefono: '+505 8765 4321',
      email: 'carla@correo.com',
    },
    estado: 'En proceso',
    creado_en: '2026-10-15T10:32:00Z',
    total: '1339.75',
    observaciones: 'Entregar por la tarde',
    items: [
      {
        producto_id: 'p-1',
        nombre: 'KPBM Shampoo Keratina',
        codigo: 'KPBM-001',
        precio: 180,
        cantidad: 2,
      },
      {
        producto_id: 2,
        nombre: 'Salon Plus Mascarilla',
        sku: 'SP-002',
        precio: '220.5',
        cantidad: '1',
      },
    ],
  },
  meta: { requestId: 'req-9' },
} as const;

/** Lista con envelope `{ items }` y bordes: sin cliente, estado desconocido, total negativo. */
export const PEDIDOS_ITEMS_FIXTURE = {
  items: [
    {
      id: 'PED-000123',
      cliente_nombre: 'Estética Bella',
      estado: 'pendiente',
      fecha: '2026-10-14T18:05:00Z',
      total: 920,
    },
    { id: 'PED-000122', estado: 'desconocido', total: -5 },
  ],
  total: 2,
} as const;

export const CLIENTE_ENVELOPE_FIXTURE = {
  data: {
    id: 42,
    codigo: 'CL-000042',
    nombre: 'Distribuidora Kemuel',
    telefono: '+505 2222 3333',
    correo: 'ventas@kemuel.com',
  },
} as const;

/** Lista directa (sin envelope) con un cliente sin id (se descarta). */
export const CLIENTES_DIRECT_FIXTURE = [
  { id: 'vc-3', nombre: 'Carla López', telefono: '+505 8765 4321', email: 'carla@correo.com' },
  { id: null, nombre: 'Cliente sin id' },
] as const;

/** Producto directo (sin envelope) con `stock` en lugar de `disponible`. */
export const PRODUCTO_VENDEDOR_FIXTURE = {
  id: 7,
  nombre: 'Camelia Oil Tratamiento',
  codigo: 'CAM-007',
  categoria: 'Tratamientos',
  precio: '195.00',
  stock: 12,
} as const;

/** Catálogo envuelto en `{ data }` con `disponible: false`. */
export const PRODUCTOS_VENDEDOR_ENVELOPE_FIXTURE = {
  data: [
    {
      id: 'p-8',
      nombre: 'Kolescrem',
      sku: 'KOL-008',
      categoria: 'Cremas',
      precio: 150,
      disponible: false,
    },
  ],
  total: 1,
} as const;
