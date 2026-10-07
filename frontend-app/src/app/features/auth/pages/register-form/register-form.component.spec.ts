import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterFormComponent],
      providers: [
        provideRouter([]),
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
});
