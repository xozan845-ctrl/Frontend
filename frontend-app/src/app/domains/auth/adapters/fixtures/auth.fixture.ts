/**
 * Fixture de contrato versionado (R-C-8) para la respuesta de login/registro del
 * backend Core Engine: envelope `{ data }`, `snake_case` y `user_id`.
 */
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
