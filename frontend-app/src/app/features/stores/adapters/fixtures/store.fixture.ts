/**
 * Fixture de contrato versionado (R-C-8) para la tienda del vendedor y el
 * catálogo de Core Engine: envelope `{ data }`, `snake_case`, id numérico y
 * fecha ISO 8601 UTC. No se actualiza contra el backend en vivo: si cambia el
 * shape, este fixture y `store.contract.spec.ts` cambian en el mismo PR.
 */
export const TIENDA_ENVELOPE_FIXTURE = {
  data: {
    id: 't-9f1c',
    vendedor_id: 'v-42',
    nombre: 'Tienda Demo',
    descripcion: 'Ropa y accesorios',
    creado_en: '2026-10-09T15:00:00Z',
  },
  meta: { requestId: 'req-1' },
} as const;

/** Respuesta sin envelope (forma actual del backend para `vendedores/tienda`). */
export const TIENDA_DIRECT_FIXTURE = {
  id: 't-direct',
  vendedor_id: 'v-1',
  nombre: 'Tienda Directa',
  descripcion: '',
  creado_en: '2026-10-09T15:00:00Z',
} as const;

/** Catálogo global envuelto en `{ data }`, con un id numérico. */
export const CATALOGO_ENVELOPE_FIXTURE = {
  data: [
    { id: 'p-1', nombre: 'Teclado Mecánico', sku: 'SKU-TEC' },
    { id: 2, nombre: 'Mouse Gamer', sku: 'SKU-MOU' },
  ],
  meta: { total: 2 },
} as const;
