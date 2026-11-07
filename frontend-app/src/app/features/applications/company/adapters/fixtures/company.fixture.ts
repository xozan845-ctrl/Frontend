/**
 * Fixtures de contrato versionados (R-C-8) de `EmpresaResponseDto` y
 * `VendedorEmpresaResponseDto` de Core Engine.
 *
 * Incluye los metadatos de empresa (`slug`, `tipo_empresa`, perfil fiscal y
 * logo) incorporados al contrato público de identity-service.
 */
export const COMPANY_FIXTURE = {
  id: 'dfe0cfe4-8ddc-42bf-8dd2-6c3cb43544b3',
  nombre: 'Empresa Prueba',
  slug: 'empresa-prueba',
  modalidad_logistica: 'hibrida',
  tipo_empresa: 'comercial',
  estado: 'activa',
  creado_por: 'e9aa395b-1654-48b0-befe-fbe38538a408',
  creado_en: '2026-10-21T19:43:28.137Z',
  ruc: 'J0310000000000',
  razon_social: 'Empresa Prueba S.A.',
  nombre_comercial: 'Prueba Store',
  descripcion: 'Tienda de prueba del contrato.',
  telefono: '+505 8888 0000',
  correo_contacto: 'hola@empresa.test',
  sitio_web: 'https://empresa.test',
  direccion: 'Calle 1, Managua',
  ciudad: 'Managua',
  departamento: 'Managua',
  pais: 'Nicaragua',
  moneda: 'NIO',
  zona_horaria: 'America/Managua',
  sector: 'Comercio',
  representante_legal: 'Ana Pérez',
  horario_atencion: 'Lun–Vie 8:00–18:00',
  logo_objeto_id: '3f1c0a8e-7d2b-4c6a-9f10-2b8d5e4a7c01',
  logo_url: 'https://cdn.empresa.test/logo.png',
  actualizado_en: '2026-10-22T10:00:00.000Z',
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
