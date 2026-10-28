/**
 * Fixture de contrato versionado (R-C-8) para la creación de una orden.
 * La fecha llega en ISO 8601 UTC con `Z` (R-C-4).
 */
export const ORDER_CREATED_ENVELOPE_FIXTURE = {
  data: {
    _id: 'ord_9f2a',
    order_number: 'ORD-000042',
    status: 'shipped',
    amount: '1299.50',
    created_at: '2026-10-01T15:04:05Z',
  },
} as const;

/** `OrderViewResponseDto` real de Core Engine (`POST/GET /orders`). */
export const ORDER_VIEW_FIXTURE = {
  id: '5f0e7b2c-9f61-4f0e-8d6a-2b7c1a9e4d11',
  vendedor_id: 'v-1',
  comprador_id: 'c-1',
  tienda_id: 't-1',
  estado: 'pagada',
  total_cents: 230000,
  comision_cents: 27600,
  moneda: 'C$',
  direccion_envio: { direccion: 'Barrio Central, casa 12' },
  items: [
    {
      oferta_id: 'of-1',
      sku: 'SKU-001',
      producto_nombre: 'Teclado Mecánico',
      cantidad: 2,
      precio_unitario_cents: 115000,
      vendedor_id: 'v-1',
      tienda_id: 't-1',
    },
  ],
  creado_en: '2026-10-22T15:00:00.000Z',
  actualizado_en: '2026-10-22T15:05:00.000Z',
  pagada_en: '2026-10-22T15:05:00.000Z',
  enviada_en: null,
  entregada_en: null,
  cancelada_en: null,
  devuelta_en: null,
} as const;
