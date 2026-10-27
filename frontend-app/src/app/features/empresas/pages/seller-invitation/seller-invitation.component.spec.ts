import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import SellerInvitationComponent from './seller-invitation.component';
import { AuthStore } from '../../../auth/public-api';
import { SellerInvitationStore } from '../../state/seller-invitation/seller-invitation.store';
import { SeoService } from '../../../../core/services/seo/seo.service';

function createStore() {
  return {
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
}

async function createFixture(
  params: Record<string, string> = {},
  query: Record<string, string> = { token: 'token' },
) {
  const store = createStore();
  await TestBed.configureTestingModule({
    imports: [SellerInvitationComponent],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap(params),
            queryParamMap: convertToParamMap(query),
          },
        },
      },
      { provide: SellerInvitationStore, useValue: store },
      { provide: AuthStore, useValue: { setSession: vi.fn() } },
      { provide: SeoService, useValue: { setPage: vi.fn(), reset: vi.fn() } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(SellerInvitationComponent);
  fixture.detectChanges();
  return { fixture, store };
}

describe('SellerInvitationComponent', () => {
  it('lee el token del query y acepta el formulario', async () => {
    const { fixture, store } = await createFixture();

    fixture.componentInstance.form.setValue({ name: 'Ana', password: 'secreto123' });
    fixture.componentInstance.accept();

    expect(store.accept).toHaveBeenCalledWith({
      token: 'token',
      data: { name: 'Ana', password: 'secreto123' },
    });
  });

  it('prioriza el token de la ruta corta /i/:token', async () => {
    const { fixture, store } = await createFixture({ token: 'token-corto' }, {});

    expect(fixture.componentInstance.token).toBe('token-corto');
    expect(store.load).toHaveBeenCalledWith('token-corto');
  });

  it('calcula la fuerza de la contraseña mientras se escribe', async () => {
    const { fixture } = await createFixture();

    fixture.componentInstance.form.controls.password.setValue('Segura123!');
    fixture.detectChanges();

    expect(fixture.componentInstance.passwordScore()).toBe(4);
    expect(fixture.componentInstance.passwordStrengthLabel()).toBe('Fuerte');
  });
});
