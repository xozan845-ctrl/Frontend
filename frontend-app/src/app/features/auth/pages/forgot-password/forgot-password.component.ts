import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AUTH_REPOSITORY } from '../../repositories/auth.repository';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AUTH_REPOSITORY);
  private readonly seoService = inject(SeoService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly submitting = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.seoService.setPage(
      'Recuperar contraseña',
      'Solicita el restablecimiento de tu contraseña.',
    );
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.error.set(null);
    this.authService.resetPassword(this.form.getRawValue().email).subscribe({
      next: () => {
        this.submitting.set(false);
        this.sent.set(true);
      },
      error: (err: Error) => {
        this.submitting.set(false);
        this.error.set(err.message || 'No se pudo enviar la solicitud. Intenta de nuevo.');
      },
    });
  }
}
export default ForgotPasswordComponent;
