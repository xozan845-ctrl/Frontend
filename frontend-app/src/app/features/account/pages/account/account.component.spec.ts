import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import AccountComponent from './account.component';
import { AUTH_REPOSITORY, AuthStore } from '../../../auth/public-api';
import { NotificationService } from '../../../../core/services/notification.service';
import { SeoService } from '../../../../core/services/seo.service';

describe('AccountComponent', () => {
  const authRepo = {
    me: vi.fn(() => of({ id: 'u-1', email: 'ana@tienda.com', name: 'Ana', role: 'comprador' })),
    changePassword: vi.fn(() => of(true)),
  };
  const authStore = {
    user: () => ({ id: 1, email: 'ana@tienda.com', name: 'Ana' }),
    clearSession: vi.fn(),
  };
  const notification = { showSuccess: vi.fn(), showError: vi.fn() };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [AccountComponent],
      providers: [
        provideRouter([]),
        { provide: AUTH_REPOSITORY, useValue: authRepo },
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
    authRepo.me.mockReturnValue(
      of({ id: 'u-1', email: 'ana@tienda.com', name: 'Ana', role: 'comprador' }),
    );
    authRepo.changePassword.mockReturnValue(of(true));
    TestBed.resetTestingModule();
  });

  it('debe cargar el perfil desde GET /auth/me', async () => {
    const fixture = await setup();

    expect(authRepo.me).toHaveBeenCalled();
    expect(fixture.componentInstance.profile()).toEqual({
      email: 'ana@tienda.com',
      role: 'comprador',
    });
  });

  it('no debe cambiar la contraseña si el formulario es inválido', async () => {
    const fixture = await setup();
    fixture.componentInstance.form.setValue({
      current: 'actual123',
      next: 'nueva12345',
      confirm: 'distinta123',
    });

    fixture.componentInstance.onSubmit();

    expect(authRepo.changePassword).not.toHaveBeenCalled();
  });

  it('debe cambiar la contraseña, limpiar la sesión y volver al login', async () => {
    const fixture = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.form.setValue({
      current: 'actual123',
      next: 'nueva12345',
      confirm: 'nueva12345',
    });

    fixture.componentInstance.onSubmit();

    expect(authRepo.changePassword).toHaveBeenCalledWith('actual123', 'nueva12345');
    expect(authStore.clearSession).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('debe notificar si el cambio de contraseña falla', async () => {
    authRepo.changePassword.mockReturnValueOnce(throwError(() => new Error('actual incorrecta')));
    const fixture = await setup();
    fixture.componentInstance.form.setValue({
      current: 'mala',
      next: 'nueva12345',
      confirm: 'nueva12345',
    });

    fixture.componentInstance.onSubmit();

    expect(notification.showError).toHaveBeenCalledWith('actual incorrecta');
    expect(authStore.clearSession).not.toHaveBeenCalled();
  });
});
