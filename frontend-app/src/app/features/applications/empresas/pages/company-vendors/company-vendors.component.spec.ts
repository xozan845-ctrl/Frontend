import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import CompanyVendorsComponent from './company-vendors.component';
import { AuthStore } from '../../../auth/public-api';
import { CompanyStore } from '../../state/company/company.store';
import { CompanyPortalStore } from '../../state/company-portal/company-portal.store';
import { CompanyInvitationsStore } from '../../state/company-invitations/company-invitations.store';
import { SeoService } from '../../../../../core/services/seo/seo.service';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import type {
  SellerInvitation,
  SellerInvitationSummary,
} from '../../models/company-invitation.model';

function setup() {
  const user = signal({
    id: 'u-1',
    name: 'Eva',
    email: 'e@test',
    role: 'empresario',
    tenantId: 'c-1',
  });
  const company = signal({
    id: 'c-1',
    name: 'Empresa Demo',
    logisticsMode: 'plataforma' as const,
    status: 'activa',
    createdBy: 'u-1',
    createdAt: '2026-10-01',
  });
  const lastInvitation = signal<SellerInvitation | null>(null);
  const invitations = signal<SellerInvitationSummary[]>([]);
  const vendors = {
    sellers: signal([]).asReadonly(),
    invitations: invitations.asReadonly(),
    pendingInvitations: computed(() =>
      invitations().filter((invitation) => invitation.status === 'pendiente'),
    ),
    pastInvitations: computed(() =>
      invitations().filter((invitation) => invitation.status !== 'pendiente'),
    ),
    lastInvitation: lastInvitation.asReadonly(),
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

  return {
    user,
    company,
    lastInvitation,
    vendors,
    portal,
    stores,
  };
}

async function createFixture() {
  const mocks = setup();

  await TestBed.configureTestingModule({
    imports: [CompanyVendorsComponent],
    providers: [
      provideRouter([]),
      { provide: AuthStore, useValue: { user: mocks.user.asReadonly() } },
      { provide: CompanyStore, useValue: { company: mocks.company.asReadonly(), load: vi.fn() } },
      { provide: CompanyPortalStore, useValue: mocks.portal },
      { provide: CompanyInvitationsStore, useValue: mocks.vendors },
      { provide: SeoService, useValue: { setPage: vi.fn(), reset: vi.fn() } },
      { provide: NotificationService, useValue: { showSuccess: vi.fn(), showError: vi.fn() } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CompanyVendorsComponent);
  fixture.detectChanges();

  return { fixture, ...mocks };
}

describe('CompanyVendorsComponent', () => {
  it('compone el correo con Gmail por defecto y envía sus datos', async () => {
    const { fixture, vendors } = await createFixture();

    fixture.componentInstance.invitationForm.patchValue({
      emailLocal: 'v',
      storeId: 't-1',
      participationPercentage: 25,
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.emailPreview()).toBe('v@gmail.com');

    fixture.componentInstance.submitInvitation();
    expect(vendors.createInvitation).toHaveBeenCalledWith({
      companyId: 'c-1',
      data: { email: 'v@gmail.com', storeId: 't-1', participationPercentage: 25 },
    });
  });

  it('separa un correo completo pegado y acepta un dominio personalizado', async () => {
    const { fixture } = await createFixture();

    fixture.componentInstance.invitationForm.patchValue({
      emailLocal: 'ana@outlook.com',
    });
    fixture.componentInstance.onEmailLocalInput();
    fixture.detectChanges();

    expect(fixture.componentInstance.invitationForm.controls.emailLocal.value).toBe('ana');
    expect(fixture.componentInstance.invitationForm.controls.emailDomain.value).toBe('outlook.com');
    expect(fixture.componentInstance.emailPreview()).toBe('ana@outlook.com');

    fixture.componentInstance.invitationForm.patchValue({
      emailDomain: 'otro',
      emailDomainCustom: 'miempresa.com',
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.isCustomDomain).toBe(true);
    expect(fixture.componentInstance.emailPreview()).toBe('ana@miempresa.com');
  });

  it('arma el mensaje de WhatsApp con empresa, tienda y enlace', async () => {
    const { fixture, lastInvitation } = await createFixture();

    lastInvitation.set({
      id: 'i-1',
      companyId: 'c-1',
      storeId: 't-1',
      storeName: 'Centro',
      email: 'ana@gmail.com',
      participationPercentage: 25,
      status: 'pendiente',
      expiresAt: '2026-10-29T12:00:00.000Z',
      invitationUrl: 'https://app.test/i/abc',
    });
    fixture.detectChanges();

    const message = fixture.componentInstance.shareMessage();
    expect(message).toContain('*Empresa Demo*');
    expect(message).toContain('*Centro*');
    expect(message).toContain('*25 %*');
    expect(message).toContain('https://app.test/i/abc');

    const whatsapp = fixture.componentInstance.whatsappShareUrl();
    expect(whatsapp.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(whatsapp.split('text=')[1])).toBe(message);
  });
});
