/**
 * Fixtures de contrato versionados (R-C-8) de los endpoints de invitaciones
 * de vendedores de Core Engine.
 */
export const SELLER_INVITATION_CREATED_FIXTURE = {
  id: '5d9f0a3f-4c62-4df4-9f36-5c25d4f7c001',
  empresa_id: 'dfe0cfe4-8ddc-42bf-8dd2-6c3cb43544b3',
  tienda_id: 'tienda-1',
  tienda_nombre: 'Tienda Centro',
  correo: 'vendedor@tienda.test',
  participacion_porcentaje: 25,
  estado: 'pendiente',
  expira_en: '2026-11-05T18:00:00.000Z',
  url_invitacion: 'https://app.test/registro/vendedor?token=inv-1',
} as const;

export const SELLER_INVITATIONS_LIST_FIXTURE = {
  vendedores: [
    {
      id: '01b18556-d3f0-4ec1-a5b8-58cfa8f98e84',
      nombre: 'Vendedor Prueba',
      correo: 'vendedor@tienda.test',
      rol: 'vendedor',
      tenant_id: 'dfe0cfe4-8ddc-42bf-8dd2-6c3cb43544b3',
      participacion_porcentaje: 25,
    },
  ],
  invitaciones: [
    {
      id: '5d9f0a3f-4c62-4df4-9f36-5c25d4f7c001',
      correo: 'vendedor@tienda.test',
      tienda_id: 'tienda-1',
      tienda_nombre: 'Tienda Centro',
      participacion_porcentaje: 25,
      estado: 'pendiente',
      expira_en: '2026-11-05T18:00:00.000Z',
    },
  ],
} as const;

export const PUBLIC_SELLER_INVITATION_FIXTURE = {
  valida: true,
  correo: 'vendedor@tienda.test',
  empresa_nombre: 'Empresa Prueba',
  tienda_nombre: 'Tienda Centro',
  participacion_porcentaje: 25,
  expira_en: '2026-11-05T18:00:00.000Z',
} as const;

export const ACCEPTED_SELLER_INVITATION_FIXTURE = {
  access_token: 'access-invitation',
  refresh_token: 'refresh-invitation',
  expira_en: 900,
  usuario: {
    id: '01b18556-d3f0-4ec1-a5b8-58cfa8f98e84',
    nombre: 'Vendedor Prueba',
    correo: 'vendedor@tienda.test',
    rol: 'vendedor',
    tenant_id: 'dfe0cfe4-8ddc-42bf-8dd2-6c3cb43544b3',
  },
} as const;
