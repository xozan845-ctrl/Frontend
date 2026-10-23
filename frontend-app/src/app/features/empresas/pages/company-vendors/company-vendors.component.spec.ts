import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import CompanyVendorsComponent from './company-vendors.component';
import { AuthStore } from '../../../auth/public-api';
import { CompanyStore } from '../../state/company/company.store';
import { CompanyPortalStore } from '../../state/company-portal/company-portal.store';
import { CompanyInvitationsStore } from '../../state/company-invitations/company-invitations.store';
import { SeoService } from '../../../../core/services/seo/seo.service';
import { NotificationService } from '../../../../core/services/notification/notification.service';

describe('CompanyVendorsComponent', () => {
  it('muestra el formulario de invitación y envía sus datos', async () => {
    const user = signal({
      id: 'u-1',
      name: 'Eva',
      email: 'e@test',
      role: 'empresario',
      tenantId: 'c-1',
    });
    const vendors = {
      sellers: signal([]).asReadonly(),
      invitations: signal([]).asReadonly(),
      lastInvitation: signal(null).asReadonly(),
      loading: signal(false).asReadonly(),
      saving: signal(false).asReadonly(),
      error: signal(null).asReadonly(),
      load: vi.fn(),
      createInvitation: vi.fn(),
      revokeInvitation: vi.fn(),
    };
    const stores = signal([
      {
        id: 't-1',
        companyId: 'c-1',
        ownerUserId: '',
        sellerId: '',
        name: 'Centro',
        description: '',
        participationPercentage: 0,
        createdAt: '',
      },
    ]);
    const portal = {
      stores: stores.asReadonly(),
      availableStores: computed(() => stores().filter((store) => !store.sellerId)),
      storesLoading: signal(false).asReadonly(),
      loadStores: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [CompanyVendorsComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { user: user.asReadonly() } },
        { provide: CompanyStore, useValue: { company: signal(null).asReadonly(), load: vi.fn() } },
        { provide: CompanyPortalStore, useValue: portal },
        { provide: CompanyInvitationsStore, useValue: vendors },
        { provide: SeoService, useValue: { setPage: vi.fn(), reset: vi.fn() } },
        { provide: NotificationService, useValue: { showSuccess: vi.fn(), showError: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompanyVendorsComponent);
    fixture.detectChanges();
    fixture.componentInstance.invitationForm.setValue({
      email: 'v@test',
      storeId: 't-1',
      participationPercentage: 25,
    });
    fixture.componentInstance.submitInvitation();
    expect(vendors.createInvitation).toHaveBeenCalledWith({
      companyId: 'c-1',
      data: { email: 'v@test', storeId: 't-1', participationPercentage: 25 },
    });
  });
});
