import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AUTH_REPOSITORY } from '../../repositories/auth.repository';
import { SeoService } from '../../../../core/services/seo.service';

describe('ForgotPasswordComponent', () => {
  const authRepo = { resetPassword: vi.fn(() => of(true)) };
  const seo = { setPage: vi.fn(), reset: vi.fn() };

  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: AUTH_REPOSITORY, useValue: authRepo },
        { provide: SeoService, useValue: seo },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('no envía la solicitud si el correo es inválido', async () => {
    const fixture = await setup();
    fixture.componentInstance.form.setValue({ email: 'no-es-un-correo' });

    fixture.componentInstance.onSubmit();

    expect(authRepo.resetPassword).not.toHaveBeenCalled();
  });

  it('envía la solicitud y muestra la confirmación', async () => {
    const fixture = await setup();
    fixture.componentInstance.form.setValue({ email: 'ana@tienda.com' });

    fixture.componentInstance.onSubmit();

    expect(authRepo.resetPassword).toHaveBeenCalledWith('ana@tienda.com');
    await vi.waitFor(() => expect(fixture.componentInstance.sent()).toBe(true));
  });

  it('muestra el error cuando la solicitud falla', async () => {
    authRepo.resetPassword.mockReturnValueOnce(throwError(() => new Error('boom')));
    const fixture = await setup();
    fixture.componentInstance.form.setValue({ email: 'ana@tienda.com' });

    fixture.componentInstance.onSubmit();

    await vi.waitFor(() => expect(fixture.componentInstance.error()).toBe('boom'));
  });
});
