import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginFormComponent } from './login-form.component';
import { AuthStore } from '../../state/auth.store';
import { SeoService } from '../../../../shared/services/seo.service';

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

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [LoginFormComponent],
      providers: [
        provideRouter([]),
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
});
