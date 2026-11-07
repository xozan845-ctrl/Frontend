import {
  adaptAcceptedSellerInvitationFromBackend,
  adaptCompanyVendorsFromBackend,
  adaptPublicSellerInvitationFromBackend,
  adaptSellerInvitationFromBackend,
} from './company-invitation.adapter';

describe('company-invitation.adapter', () => {
  it('normaliza la invitación creada', () => {
    expect(
      adaptSellerInvitationFromBackend({
        id: 'i-1',
        empresa_id: 'c-1',
        tienda_id: 't-1',
        tienda_nombre: 'Centro',
        correo: 'v@correo.test',
        participacion_porcentaje: 25,
        estado: 'pendiente',
        expira_en: '2026-10-26T00:00:00.000Z',
        url_invitacion: 'https://app.test/registro/vendedor?token=x',
      }),
    ).toMatchObject({ id: 'i-1', storeId: 't-1', participationPercentage: 25 });
  });

  it('normaliza vendedores e invitaciones del listado', () => {
    expect(
      adaptCompanyVendorsFromBackend({
        vendedores: [{ id: 'v-1', nombre: 'Ana', correo: 'a@test', rol: 'vendedor' }],
        invitaciones: [
          {
            id: 'i-1',
            correo: 'b@test',
            tienda_id: 't-2',
            tienda_nombre: 'Norte',
            participacion_porcentaje: 20,
            estado: 'pendiente',
            expira_en: '2026-10-26',
          },
        ],
      }),
    ).toMatchObject({ sellers: [{ id: 'v-1', name: 'Ana' }], invitations: [{ id: 'i-1' }] });
  });

  it('normaliza la invitación pública y la sesión de aceptación', () => {
    expect(
      adaptPublicSellerInvitationFromBackend({ valida: true, correo: 'a@test' }),
    ).toMatchObject({
      valid: true,
      email: 'a@test',
    });
    expect(
      adaptAcceptedSellerInvitationFromBackend({
        access_token: 'access',
        refresh_token: 'refresh',
        usuario: { id: 'v-1', nombre: 'Ana', correo: 'a@test', rol: 'vendedor' },
      }),
    ).toMatchObject({ token: 'access', refreshToken: 'refresh', user: { role: 'vendedor' } });
  });

  it('tolera payloads inválidos, envoltorios data y datos opcionales', () => {
    expect(adaptSellerInvitationFromBackend(null)).toBeNull();
    expect(adaptSellerInvitationFromBackend({})).toBeNull();
    expect(
      adaptSellerInvitationFromBackend({ data: { id: 'i-2', correo: 'v@test' } }),
    ).toMatchObject({
      id: 'i-2',
      status: 'pendiente',
      participationPercentage: 0,
    });
    expect(
      adaptCompanyVendorsFromBackend({ data: { vendedores: null, invitaciones: null } }),
    ).toEqual({
      sellers: [],
      invitations: [],
    });
    expect(
      adaptCompanyVendorsFromBackend({
        vendedores: [
          { id: 'v-2', correo: 'b@test', participacion_porcentaje: 120, tienda_id: 't-2' },
          {},
        ],
        invitaciones: [{ id: 'i-2', correo: 'c@test', participacion_porcentaje: -5 }, {}],
      }),
    ).toMatchObject({
      sellers: [{ id: 'v-2', name: 'Vendedor', participationPercentage: 100, storeId: 't-2' }],
      invitations: [{ id: 'i-2', participationPercentage: 0 }],
    });
    expect(adaptPublicSellerInvitationFromBackend({ valid: false })).toMatchObject({
      valid: false,
      participationPercentage: 0,
    });
    expect(adaptPublicSellerInvitationFromBackend('invalid')).toBeNull();
  });
});
