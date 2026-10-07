import { adaptAuthResponseFromBackend } from './auth.adapter';
import { AUTH_LOGIN_ENVELOPE_FIXTURE } from './fixtures/auth.fixture';

// R-C-8: contrato contra fixture versionado, no contra el backend en vivo.
describe('auth.contract', () => {
  it('debe normalizar la respuesta de login envuelta en data', () => {
    const response = adaptAuthResponseFromBackend(AUTH_LOGIN_ENVELOPE_FIXTURE);

    expect(response.user).toMatchObject({
      id: 42,
      email: 'ana@tienda.com',
      name: 'Ana Pérez',
      role: 'admin',
      avatar: 'https://cdn.example.com/avatars/ana.png',
    });
  });

  it('debe extraer access y refresh token (R-SE-1)', () => {
    const response = adaptAuthResponseFromBackend(AUTH_LOGIN_ENVELOPE_FIXTURE);

    expect(response.token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access');
    expect(response.refreshToken).toBe('def50200.rotating-refresh-token');
  });
});
