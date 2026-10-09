/**
 * Fixture de contrato versionado (R-C-8) para el carrito del servidor de Core
 * Engine: envelope `{ data }`, `snake_case` y tipos string numéricos. No se
 * actualiza contra el backend en vivo: si cambia el shape, este fixture y
 * `cart.contract.spec.ts` cambian en el mismo PR.
 */
export const CART_ENVELOPE_FIXTURE = {
  data: {
    items: [
      {
        oferta_id: 'of-1',
        cantidad: 2,
        producto_nombre: 'Teclado Mecánico',
        precio_venta: '299.90',
        stock: 5,
        sku: 'SKU-TEC',
      },
      {
        oferta_id: 2,
        cantidad: 1,
        producto_nombre: 'Mouse Gamer',
        precio_venta: 50,
        stock: 0,
        sku: 'SKU-MOU',
      },
    ],
    total: 649.8,
    expira_en: '2026-10-10T00:00:00Z',
  },
  meta: { requestId: 'req-1' },
} as const;

/** Respuesta sin envelope (forma directa del backend para `/carrito`). */
export const CART_DIRECT_FIXTURE = {
  items: [
    {
      oferta_id: 'of-9',
      cantidad: 3,
      producto_nombre: 'Mousepad XL',
      precio_venta: 20,
      stock: 1,
      sku: 'SKU-PAD',
    },
  ],
  total: 60,
} as const;
