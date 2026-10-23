import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import SellerInvitationComponent from './seller-invitation.component';
import { AuthStore } from '../../../auth/public-api';
import { SellerInvitationStore } from '../../state/seller-invitation/seller-invitation.store';
import { SeoService } from '../../../../core/services/seo/seo.service';

describe('SellerInvitationComponent', () => {
  it('muestra la invitación y acepta el formulario', async () => {
    const store = {
      invitation: signal({
        valid: true,
        email: 'v@test',
        companyName: 'Empresa',
        storeName: 'Centro',
        participationPercentage: 25,
        expiresAt: '2026-10-26',
      }).asReadonly(),
      session: signal(null).asReadonly(),
      loading: signal(false).asReadonly(),
      accepting: signal(false).asReadonly(),
      error: signal(null).asReadonly(),
      load: vi.fn(),
      accept: vi.fn(),
      clearError: vi.fn(),
      invalidate: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [SellerInvitationComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ token: 'token' }) } },
        },
        { provide: SellerInvitationStore, useValue: store },
        { provide: AuthStore, useValue: { setSession: vi.fn() } },
        { provide: SeoService, useValue: { setPage: vi.fn(), reset: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SellerInvitationComponent);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ name: 'Ana', password: 'secreto123' });
    fixture.componentInstance.accept();
    expect(store.accept).toHaveBeenCalledWith({
      token: 'token',
      data: { name: 'Ana', password: 'secreto123' },
    });
  });
});
