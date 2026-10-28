/** `EnvioConMontoResponseDto` real de `GET /admin/envios`. */
export const SHIPMENTS_FIXTURE = [
  {
    id: 'e-1',
    guia: 'BGH-ABC123-DEF456',
    order_id: 'o-1',
    empresa_id: 'emp-1',
    modalidad_logistica: 'hibrida',
    proveedor_tipo: null,
    proveedor_tenant_id: null,
    estado: 'en_preparacion',
    creado_en: '2026-10-22T15:00:00.000Z',
    monto: '2300.00',
  },
  {
    id: 'e-2',
    guia: 'BGH-XYZ789-GHI012',
    order_id: 'o-2',
    empresa_id: 'emp-1',
    modalidad_logistica: 'plataforma',
    proveedor_tipo: 'plataforma',
    proveedor_tenant_id: '00000000-0000-0000-0000-000000000001',
    estado: 'enviada',
    creado_en: '2026-10-22T14:00:00.000Z',
  },
] as const;
