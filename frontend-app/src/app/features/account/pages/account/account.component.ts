import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UpperCasePipe } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../auth/public-api';
import { NotificationService } from '../../../../core/services/notification.service';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';

/** Valida que `confirm` coincida con `next`. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const next = group.get('next')?.value;
  const confirm = group.get('confirm')?.value;
  return next && confirm && next !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [ReactiveFormsModule, UpperCasePipe, RouterLink],
  templateUrl: './account.component.html',
})
export default class AccountComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly authStore = inject(AuthStore);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly seoService = injectSeoPage('Mi cuenta', 'Gestiona tu cuenta y tu contraseña.');
  private readonly destroyRef = inject(DestroyRef);

  /** Perfil autoritativo de `GET /auth/me`. */
  readonly profile = signal<{ email: string; role: string } | null>(null);
  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      current: ['', [Validators.required]],
      next: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required]],
    },
    { validators: [passwordsMatch] },
  );

  ngOnInit(): void {
    this.authStore
      .me()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => this.profile.set({ email: user.email, role: user.role ?? '' }),
        error: () => {
          // El perfil local (`AuthStore`) ya muestra los datos; no bloquea la página.
        },
      });
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { current, next } = this.form.getRawValue();
    this.submitting.set(true);
    this.authStore
      .changePassword(current, next)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.notification.showSuccess('Contraseña actualizada. Vuelve a iniciar sesión.');
          // Core Engine invalida las sesiones al cambiarla: limpiamos la local.
          this.authStore.clearSession();
          this.router.navigate(['/login']);
        },
        error: (err: Error) => {
          this.submitting.set(false);
          this.notification.showError(err.message || 'No se pudo cambiar la contraseña.');
        },
      });
  }
}
