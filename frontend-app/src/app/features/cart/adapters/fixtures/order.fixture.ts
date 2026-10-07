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
