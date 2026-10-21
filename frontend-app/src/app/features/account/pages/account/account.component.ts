import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UpperCasePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../auth/public-api';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { ChangePasswordFormComponent } from '../../components/change-password-form/change-password-form.component';
import type { AccountProfile, PasswordChangePayload } from '../../models/account.model';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [UpperCasePipe, RouterLink, ChangePasswordFormComponent],
  templateUrl: './account.component.html',
})
export default class AccountComponent {
  readonly authStore = inject(AuthStore);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly seoService = injectSeoPage('Mi cuenta', 'Gestiona tu cuenta y tu contraseña.');
  private readonly destroyRef = inject(DestroyRef);

  /** Perfil autoritativo de `GET /auth/me`. */
  readonly profile = signal<AccountProfile | null>(null);
  readonly submitting = signal(false);

  private readonly loadProfile = this.authStore
    .me()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (user) => this.profile.set({ email: user.email, role: user.role ?? '' }),
      error: () => {
        // El perfil local (`AuthStore`) ya muestra los datos; no bloquea la página.
      },
    });

  onPasswordSubmit(payload: PasswordChangePayload): void {
    if (this.submitting()) return;

    this.submitting.set(true);
    this.authStore
      .changePassword(payload.current, payload.next)
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
