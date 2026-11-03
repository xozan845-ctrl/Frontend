import {
  adaptAcceptedSellerInvitationFromBackend,
  adaptCompanyVendorsFromBackend,
  adaptPublicSellerInvitationFromBackend,
  adaptSellerInvitationFromBackend,
} from './company-invitation.adapter';
import {
  ACCEPTED_SELLER_INVITATION_FIXTURE,
  PUBLIC_SELLER_INVITATION_FIXTURE,
  SELLER_INVITATION_CREATED_FIXTURE,
  SELLER_INVITATIONS_LIST_FIXTURE,
} from '../fixtures/company-invitation.fixture';

// R-C-8: contrato contra fixtures versionados, no contra el backend en vivo.
describe('company-invitation.contract', () => {
  it('normaliza la invitación creada por el gateway', () => {
    expect(adaptSellerInvitationFromBackend(SELLER_INVITATION_CREATED_FIXTURE)).toEqual({
      id: SELLER_INVITATION_CREATED_FIXTURE.id,
      companyId: SELLER_INVITATION_CREATED_FIXTURE.empresa_id,
      storeId: SELLER_INVITATION_CREATED_FIXTURE.tienda_id,
      storeName: SELLER_INVITATION_CREATED_FIXTURE.tienda_nombre,
      email: SELLER_INVITATION_CREATED_FIXTURE.correo,
      participationPercentage: 25,
      status: 'pendiente',
      expiresAt: SELLER_INVITATION_CREATED_FIXTURE.expira_en,
      invitationUrl: SELLER_INVITATION_CREATED_FIXTURE.url_invitacion,
    });
  });

  it('normaliza vendedores e invitaciones del listado', () => {
    expect(adaptCompanyVendorsFromBackend(SELLER_INVITATIONS_LIST_FIXTURE)).toEqual({
      sellers: [
        {
          id: '01b18556-d3f0-4ec1-a5b8-58cfa8f98e84',
          name: 'Vendedor Prueba',
          email: 'vendedor@tienda.test',
          role: 'vendedor',
          storeId: 'tienda-1',
          storeName: 'Tienda Centro',
          participationPercentage: 25,
          status: 'activo',
          avatarObjectId: '3f1c0a8e-7d2b-4c6a-9f10-2b8d5e4a7c01',
          avatarUrl: '/api/v1/storage/public/objetos/3f1c0a8e-7d2b-4c6a-9f10-2b8d5e4a7c01',
        },
      ],
      invitations: [
        {
          id: SELLER_INVITATION_CREATED_FIXTURE.id,
          email: 'vendedor@tienda.test',
          storeId: 'tienda-1',
          storeName: 'Tienda Centro',
          participationPercentage: 25,
          status: 'pendiente',
          expiresAt: SELLER_INVITATION_CREATED_FIXTURE.expira_en,
        },
      ],
    });
  });

  it('normaliza la invitación pública y la sesión de aceptación', () => {
    expect(adaptPublicSellerInvitationFromBackend(PUBLIC_SELLER_INVITATION_FIXTURE)).toEqual({
      valid: true,
      email: 'vendedor@tienda.test',
      companyName: 'Empresa Prueba',
      storeName: 'Tienda Centro',
      participationPercentage: 25,
      expiresAt: PUBLIC_SELLER_INVITATION_FIXTURE.expira_en,
    });
    expect(
      adaptAcceptedSellerInvitationFromBackend(ACCEPTED_SELLER_INVITATION_FIXTURE),
    ).toMatchObject({
      token: 'access-invitation',
      refreshToken: 'refresh-invitation',
      user: { id: ACCEPTED_SELLER_INVITATION_FIXTURE.usuario.id, role: 'vendedor' },
    });
  });
});
