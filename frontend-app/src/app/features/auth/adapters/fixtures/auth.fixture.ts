/**
 * Fixtures de contrato versionados (R-C-8) de Core Engine.
 *
 * `AUTH_SESION_FIXTURE` reproduce `SesionResponseDto` tal como lo devuelve
 * `POST /api/v1/auth/login` (respuesta plana, `snake_case`, usuario en
 * `usuario`). `AUTH_LOGIN_ENVELOPE_FIXTURE` conserva el envelope `{ data }`
 * heredado para probar la tolerancia del adapter (R-AR-4).
 */
export const AUTH_SESION_FIXTURE = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access',
  refresh_token: 'def50200.rotating-refresh-token',
  expira_en: 900,
  usuario: {
    id: '42',
    nombre: 'Ana Pérez',
    correo: 'ana@tienda.test',
    rol: 'empresario',
    tenant_id: 'tenant-1',
    personal_id: 'personal-1',
  },
} as const;

export const AUTH_LOGIN_ENVELOPE_FIXTURE = {
  data: {
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access',
    refresh_token: 'def50200.rotating-refresh-token',
    user: {
      user_id: 42,
      email: 'ana@tienda.com',
      full_name: 'Ana Pérez',
      roles: ['admin'],
      avatar_url: 'https://cdn.example.com/avatars/ana.png',
    },
  },
  meta: { requestId: 'req-123' },
} as const;
