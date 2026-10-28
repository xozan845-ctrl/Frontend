import { Component, inject, input, output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import type { PasswordChangePayload } from '../../models/account.model';

/** Valida que `confirm` coincida con `next`. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const next = group.get('next')?.value;
  const confirm = group.get('confirm')?.value;
  return next && confirm && next !== confirm ? { passwordMismatch: true } : null;
}

/**
 * Formulario de cambio de contraseña (`R-AR-7`, `R-SO-8`): presentacional,
 * valida en cliente y emite el payload; la página resuelve la autenticación.
 */
@Component({
  selector: 'app-change-password-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './change-password-form.component.html',
})
export class ChangePasswordFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly submitting = input(false);
  readonly passwordSubmit = output<PasswordChangePayload>();

  readonly form = this.fb.nonNullable.group(
    {
      current: ['', [Validators.required]],
      next: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required]],
    },
    { validators: [passwordsMatch] },
  );

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { current, next } = this.form.getRawValue();
    this.passwordSubmit.emit({ current, next });
  }
}
