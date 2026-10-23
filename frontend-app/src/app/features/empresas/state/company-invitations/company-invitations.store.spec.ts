import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CompanyInvitationsStore } from './company-invitations.store';
import { COMPANY_INVITATION_REPOSITORY } from '../../repositories/company-invitation.repository';
import { NotificationService } from '../../../../core/services/notification/notification.service';

describe('CompanyInvitationsStore', () => {
  it('carga vendedores y genera una invitación', async () => {
    const repository = {
      list: vi.fn(() => of({ sellers: [], invitations: [] })),
      create: vi.fn(() =>
        of({
          id: 'i-1',
          companyId: 'c-1',
          storeId: 't-1',
          storeName: 'Centro',
          email: 'v@test',
          participationPercentage: 25,
          status: 'pendiente',
          expiresAt: '2026-10-26',
          invitationUrl: 'https://app.test/invite',
        }),
      ),
      revoke: vi.fn(() => of(true)),
      getPublic: vi.fn(),
      accept: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        CompanyInvitationsStore,
        { provide: COMPANY_INVITATION_REPOSITORY, useValue: repository },
        { provide: NotificationService, useValue: { showSuccess: vi.fn(), showError: vi.fn() } },
      ],
    });
    const store = TestBed.inject(CompanyInvitationsStore);
    store.load('c-1');
    store.createInvitation({
      companyId: 'c-1',
      data: { email: 'v@test', storeId: 't-1', participationPercentage: 25 },
    });
    await vi.waitFor(() => expect(store.lastInvitation()?.id).toBe('i-1'));
    expect(repository.create).toHaveBeenCalled();
  });
});
