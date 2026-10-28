/**
 * Fixtures de contrato versionados (R-C-8) de `EmpresaResponseDto` y
 * `VendedorEmpresaResponseDto` de Core Engine.
 */
export const COMPANY_FIXTURE = {
  id: 'dfe0cfe4-8ddc-42bf-8dd2-6c3cb43544b3',
  nombre: 'Empresa Prueba',
  modalidad_logistica: 'hibrida',
  estado: 'activa',
  creado_por: 'e9aa395b-1654-48b0-befe-fbe38538a408',
  creado_en: '2026-10-21T19:43:28.137Z',
} as const;

export const COMPANY_SELLER_FIXTURE = {
  id: '01b18556-d3f0-4ec1-a5b8-58cfa8f98e84',
  nombre: 'Vendedor Prueba',
  correo: 'vendedor@tienda.test',
  rol: 'vendedor',
  tenant_id: 'dfe0cfe4-8ddc-42bf-8dd2-6c3cb43544b3',
  participacion_porcentaje: 25,
  creado_en: '2026-10-21T19:43:28.255Z',
} as const;
