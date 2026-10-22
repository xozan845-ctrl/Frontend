import { adaptAuthResponseFromBackend, adaptUserFromBackend } from './auth.adapter';
import { AUTH_LOGIN_ENVELOPE_FIXTURE, AUTH_SESION_FIXTURE } from '../fixtures/auth.fixture';

// R-C-8: contrato contra fixture versionado, no contra el backend en vivo.
describe('auth.contract', () => {
  it('debe normalizar la respuesta real de sesión (`SesionResponseDto`)', () => {
    const response = adaptAuthResponseFromBackend(AUTH_SESION_FIXTURE);

    expect(response.user).toMatchObject({
      id: '42',
      email: 'ana@tienda.test',
      name: 'Ana Pérez',
      role: 'empresario',
      tenantId: 'tenant-1',
      personalId: 'personal-1',
    });
  });

  it('debe extraer access y refresh token (R-SE-1)', () => {
    const response = adaptAuthResponseFromBackend(AUTH_SESION_FIXTURE);

    expect(response.token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access');
    expect(response.refreshToken).toBe('def50200.rotating-refresh-token');
  });

  it('debe normalizar `UsuarioContextoResponseDto` (`GET /auth/me`)', () => {
    const user = adaptUserFromBackend({
      user_id: 'u-1',
      email: 'ana@tienda.test',
      rol: 'vendedor',
      nombre: 'Ana Pérez',
      tenant_id: 'tenant-1',
      personal_id: 'personal-1',
    });

    expect(user).toMatchObject({
      id: 'u-1',
      email: 'ana@tienda.test',
      name: 'Ana Pérez',
      role: 'vendedor',
      tenantId: 'tenant-1',
      personalId: 'personal-1',
    });
  });

  it('debe seguir tolerando el envelope `{ data }` heredado (R-AR-4)', () => {
    const response = adaptAuthResponseFromBackend(AUTH_LOGIN_ENVELOPE_FIXTURE);

    expect(response.user).toMatchObject({
      id: 42,
      email: 'ana@tienda.com',
      name: 'Ana Pérez',
      role: 'admin',
      avatar: 'https://cdn.example.com/avatars/ana.png',
    });
  });

  it('debe conservar el alcance de tienda, permisos y propietario logístico', () => {
    const user = adaptUserFromBackend({
      user_id: 'seller-1',
      correo: 'seller@tienda.test',
      nombre: 'Vera',
      rol: 'vendedor',
      tenant_id: 'company-1',
      tienda_id: 'store-1',
      permisos: ['store:manage-roles'],
      logistics_ownership: 'store',
    });

    expect(user).toMatchObject({
      storeId: 'store-1',
      tenantId: 'company-1',
      permissions: ['store:manage-roles'],
      logisticsOwnership: 'store',
    });
  });
});
