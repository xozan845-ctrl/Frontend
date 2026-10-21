import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import AccountComponent from './account.component';
import { AuthStore } from '../../../auth/public-api';
import { NotificationService } from '../../../../core/services/notification.service';
import { SeoService } from '../../../../core/services/seo/seo.service';

describe('AccountComponent', () => {
  const authStore = {
    user: () => ({ id: 1, email: 'ana@tienda.com', name: 'Ana' }),
    me: vi.fn(() => of({ id: 'u-1', email: 'ana@tienda.com', name: 'Ana', role: 'comprador' })),
    changePassword: vi.fn(() => of(true)),
    clearSession: vi.fn(),
  };
  const notification = { showSuccess: vi.fn(), showError: vi.fn() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [AccountComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: authStore },
        { provide: NotificationService, useValue: notification },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AccountComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authStore.me.mockReturnValue(
      of({ id: 'u-1', email: 'ana@tienda.com', name: 'Ana', role: 'comprador' }),
    );
    authStore.changePassword.mockReturnValue(of(true));
    TestBed.resetTestingModule();
  });

  it('debe cargar el perfil desde GET /auth/me', async () => {
    const fixture = await setup();

    expect(authStore.me).toHaveBeenCalled();
    expect(fixture.componentInstance.profile()).toEqual({
      email: 'ana@tienda.com',
      role: 'comprador',
    });
  });

  it('debe cambiar la contraseña, limpiar la sesión y volver al login', async () => {
    const fixture = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.onPasswordSubmit({
      current: 'actual123',
      next: 'nueva12345',
    });

    expect(authStore.changePassword).toHaveBeenCalledWith('actual123', 'nueva12345');
    expect(authStore.clearSession).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('debe notificar si el cambio de contraseña falla', async () => {
    authStore.changePassword.mockReturnValueOnce(throwError(() => new Error('actual incorrecta')));
    const fixture = await setup();

    fixture.componentInstance.onPasswordSubmit({
      current: 'mala',
      next: 'nueva12345',
    });

    expect(notification.showError).toHaveBeenCalledWith('actual incorrecta');
    expect(authStore.clearSession).not.toHaveBeenCalled();
  });

  it('debe restaurar el SEO al destruirse', async () => {
    const fixture = await setup();

    fixture.destroy();

    expect(seo.reset).toHaveBeenCalled();
  });
});
