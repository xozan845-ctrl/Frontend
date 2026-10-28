/** `EnvioResponseDto` / `EnvioConMontoResponseDto` de Core Engine. */
export interface BackendEnvioDTO {
  id?: string | null;
  guia?: string | null;
  order_id?: string | null;
  orderId?: string | null;
  empresa_id?: string | null;
  empresaId?: string | null;
  modalidad_logistica?: string | null;
  modalidadLogistica?: string | null;
  proveedor_tipo?: string | null;
  proveedorTipo?: string | null;
  proveedor_tenant_id?: string | null;
  proveedorTenantId?: string | null;
  estado?: string | null;
  creado_en?: string | null;
  creadoEn?: string | null;
  monto?: string | number | null;
}
