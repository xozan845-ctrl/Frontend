import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { RegisterFormComponent } from './register-form.component';
import { AuthStore } from '../../state/auth.store';
import { SeoService } from '../../../../core/services/seo.service';

describe('RegisterFormComponent', () => {
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
      imports: [RegisterFormComponent],
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
    const fixture = TestBed.createComponent(RegisterFormComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => vi.clearAllMocks());

  it('debe crear el formulario con nombre, email y password', async () => {
    const fixture = await setup();

    expect(fixture.componentInstance.registerForm.contains('name')).toBe(true);
    expect(fixture.componentInstance.registerForm.contains('email')).toBe(true);
    expect(fixture.componentInstance.registerForm.contains('password')).toBe(true);
  });

  it('no debe registrar cuando el formulario es inválido', async () => {
    const fixture = await setup();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(authStore.register).not.toHaveBeenCalled();
  });

  it('debe exigir contraseñas de al menos 8 caracteres (back: MinLength 8)', async () => {
    const fixture = await setup();
    const password = fixture.componentInstance.registerForm.get('password');

    password?.setValue('corta12');
    expect(password?.invalid).toBe(true);

    password?.setValue('segura12');
    expect(password?.valid).toBe(true);
  });

  it('debe registrar cuando el formulario es válido', async () => {
    const fixture = await setup();
    fixture.componentInstance.registerForm.setValue({
      name: 'Ana',
      email: 'ana@tienda.com',
      password: 'secreto1',
    });

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(authStore.register).toHaveBeenCalledWith({
      name: 'Ana',
      email: 'ana@tienda.com',
      password: 'secreto1',
    });
  });

  // ADR-22: el alta pedida desde el panel crea una cuenta de vendedor.
  it('debe registrar como vendedor cuando el alta llega del panel', async () => {
    const fixture = await setup({ rol: 'seller', returnUrl: '/vendedor/inicio' });
    fixture.componentInstance.registerForm.setValue({
      name: 'Vera',
      email: 'vera@tienda.com',
      password: 'secreto1',
    });

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(authStore.register).toHaveBeenCalledWith({
      name: 'Vera',
      email: 'vera@tienda.com',
      password: 'secreto1',
      role: 'seller',
    });
  });

  it('debe titular el alta de vendedor cuando el alta llega del panel', async () => {
    const fixture = await setup({ rol: 'seller', returnUrl: '/vendedor/inicio' });

    expect(fixture.nativeElement.querySelector('h2').textContent).toContain('Vendedor');
  });

  // ADR-24: el alta pedida desde el header de facturación crea cuenta de facturador.
  it('debe registrar como facturador cuando el alta llega de facturación', async () => {
    const fixture = await setup({ rol: 'biller', returnUrl: '/facturacion/nueva' });
    fixture.componentInstance.registerForm.setValue({
      name: 'Fabi',
      email: 'fabi@tienda.com',
      password: 'secreto1',
    });

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(authStore.register).toHaveBeenCalledWith({
      name: 'Fabi',
      email: 'fabi@tienda.com',
      password: 'secreto1',
      role: 'biller',
    });
  });

  it('debe titular y avisar del alta de facturador', async () => {
    const fixture = await setup({ rol: 'biller', returnUrl: '/facturacion/nueva' });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('h2')?.textContent).toContain('Facturador');
    expect(host.querySelector('[data-testid="billing-intent-notice"]')?.textContent).toContain(
      'cuenta de facturador',
    );
    expect(seo.setPage).toHaveBeenCalledWith('Cuenta de facturador', expect.any(String));
  });
});
