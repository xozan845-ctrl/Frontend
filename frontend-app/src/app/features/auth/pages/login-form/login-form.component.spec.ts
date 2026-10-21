import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { LoginFormComponent } from './login-form.component';
import { AuthStore } from '../../state/auth/auth.store';
import { SeoService } from '../../../../core/services/seo/seo.service';

describe('LoginFormComponent', () => {
  const authStore = {
    login: vi.fn(),
    register: vi.fn(),
    isAuthenticated: () => false,
    error: () => null,
    loading: () => false,
    clearError: vi.fn(),
  };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async (query: Record<string, string> = {}) => {
    await TestBed.configureTestingModule({
      imports: [LoginFormComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(query) } },
        },
        { provide: AuthStore, useValue: authStore },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(LoginFormComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => vi.clearAllMocks());

  it('debe crear el formulario con email y password', async () => {
    const fixture = await setup();

    expect(fixture.componentInstance.loginForm.contains('email')).toBe(true);
    expect(fixture.componentInstance.loginForm.contains('password')).toBe(true);
  });

  it('debe alternar la visibilidad de la contraseña', async () => {
    const fixture = await setup();

    expect(fixture.componentInstance.showPassword()).toBe(false);
    fixture.componentInstance.showPassword.set(true);
    expect(fixture.componentInstance.showPassword()).toBe(true);
  });

  it('no debe iniciar sesión cuando el formulario es inválido', async () => {
    const fixture = await setup();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(authStore.login).not.toHaveBeenCalled();
  });

  it('debe iniciar sesión con credenciales válidas', async () => {
    const fixture = await setup();
    fixture.componentInstance.loginForm.setValue({
      email: 'ana@tienda.com',
      password: 'secreto1',
    });

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(authStore.login).toHaveBeenCalledWith({
      email: 'ana@tienda.com',
      password: 'secreto1',
    });
  });

  it('debe marcar un campo inválido cuando el usuario lo toca', async () => {
    const fixture = await setup();
    const email = fixture.componentInstance.loginForm.get('email')!;

    email.markAsTouched();

    expect(fixture.componentInstance.isFieldInvalid('email')).toBe(true);
  });

  // ADR-22: llegada desde el panel → aviso y alta con rol vendedor.
  it('debe ofrecer el alta de vendedor cuando llega del panel', async () => {
    const fixture = await setup({ returnUrl: '/vendedor/inicio' });

    const notice = fixture.nativeElement.querySelector('[data-testid="vendor-intent-notice"]');
    expect(notice.textContent).toContain('cuenta de vendedor');
    expect(notice.querySelector('a').getAttribute('href')).toContain('rol=seller');
    expect(fixture.componentInstance.registerQueryParams).toEqual({
      returnUrl: '/vendedor/inicio',
      rol: 'seller',
    });
  });

  it('no debe ofrecer el alta de vendedor cuando el origen no es el panel', async () => {
    const fixture = await setup({ returnUrl: '/checkout' });

    expect(fixture.nativeElement.querySelector('[data-testid="vendor-intent-notice"]')).toBeFalsy();
    expect(fixture.componentInstance.registerQueryParams).toEqual({});
  });
});
