/** Respuestas reales de ventas y tiendas de empresa. */
export const COMPANY_SALES_FIXTURE = {
  empresa_id: 'empresa-1',
  ventas: [
    {
      order_id: 'o-1',
      venta: '2300.00',
      comision: '276.00',
      monto_empresario: '2024.00',
      estado: 'acreditada',
      fecha: '2026-10-22T15:00:00.000Z',
    },
  ],
  comisiones_pendientes: '138.00',
  liquidaciones: [],
} as const;

export const COMPANY_STORES_FIXTURE = [
  {
    id: 'tienda-1',
    empresa_id: 'empresa-1',
    propietario_usuario_id: 'user-1',
    participacion_porcentaje: 100,
    vendedor_id: 'vendedor-1',
    nombre: 'Tienda Centro',
    descripcion: 'Sucursal central',
    creado_en: '2026-10-21T10:00:00.000Z',
  },
  {
    id: 'tienda-2',
    empresa_id: 'empresa-1',
    propietario_usuario_id: 'user-2',
    participacion_porcentaje: 40,
    vendedor_id: 'vendedor-2',
    nombre: 'Tienda Norte',
    descripcion: '',
    creado_en: '2026-10-22T10:00:00.000Z',
  },
] as const;
