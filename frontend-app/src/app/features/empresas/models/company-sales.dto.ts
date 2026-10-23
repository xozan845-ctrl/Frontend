/** `VentaEmpresaResponseDto` de Core Engine. */
export interface BackendCompanySaleDTO {
  order_id?: string | null;
  orderId?: string | null;
  venta?: string | number | null;
  comision?: string | number | null;
  monto_empresario?: string | number | null;
  montoEmpresario?: string | number | null;
  estado?: string | null;
  fecha?: string | null;
}

/** `EstadoCuentaEmpresaResponseDto` de Core Engine. */
export interface BackendCompanySalesDTO {
  empresa_id?: string | null;
  empresaId?: string | null;
  ventas?: unknown[] | null;
  comisiones_pendientes?: string | number | null;
  comisionesPendientes?: string | number | null;
}
