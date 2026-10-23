import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SellerInvitationStore } from './seller-invitation.store';
import { COMPANY_INVITATION_REPOSITORY } from '../../repositories/company-invitation.repository';

describe('SellerInvitationStore', () => {
  it('consulta y acepta la invitación pública', async () => {
    const repository = {
      list: vi.fn(),
      create: vi.fn(),
      revoke: vi.fn(),
      getPublic: vi.fn(() =>
        of({
          valid: true,
          email: 'v@test',
          companyName: 'Empresa',
          storeName: 'Centro',
          participationPercentage: 25,
          expiresAt: '2026-10-26',
        }),
      ),
      accept: vi.fn(() =>
        of({
          user: { id: 'v-1', email: 'v@test', name: 'Ana', role: 'vendedor' },
          token: 'a',
          refreshToken: 'r',
        }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [
        SellerInvitationStore,
        { provide: COMPANY_INVITATION_REPOSITORY, useValue: repository },
      ],
    });
    const store = TestBed.inject(SellerInvitationStore);
    store.load('token');
    store.accept({ token: 'token', data: { name: 'Ana', password: 'secreto123' } });
    await vi.waitFor(() => expect(store.session()?.token).toBe('a'));
    expect(store.invitation()?.storeName).toBe('Centro');
  });

  it('maneja invitaciones inválidas y errores de aceptación', async () => {
    const repository = {
      list: vi.fn(),
      create: vi.fn(),
      revoke: vi.fn(),
      getPublic: vi.fn(() => throwError(() => new Error('Invitación expirada.'))),
      accept: vi.fn(() => throwError(() => new Error('Correo existente.'))),
    };
    TestBed.configureTestingModule({
      providers: [
        SellerInvitationStore,
        { provide: COMPANY_INVITATION_REPOSITORY, useValue: repository },
      ],
    });
    const store = TestBed.inject(SellerInvitationStore);
    store.load('expired');
    await vi.waitFor(() => expect(store.error()).toBe('Invitación expirada.'));
    store.accept({ token: 'expired', data: { name: 'Ana', password: 'secreto123' } });
    await vi.waitFor(() => expect(store.error()).toBe('Correo existente.'));
    store.clearError();
    store.invalidate();
    expect(store.error()).toContain('no contiene un token');
  });
});
