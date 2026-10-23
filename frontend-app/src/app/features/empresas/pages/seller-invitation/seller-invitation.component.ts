import { Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { AuthStore } from '../../../auth/public-api';
import { SellerInvitationStore } from '../../state/seller-invitation/seller-invitation.store';

/** Formulario público para aceptar una invitación de vendedor. */
@Component({
  selector: 'app-seller-invitation',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './seller-invitation.component.html',
})
export default class SellerInvitationComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  readonly invitationStore = inject(SellerInvitationStore);
  private readonly seoService = injectSeoPage(
    'Únete como vendedor',
    'Completa tu registro para unirte a la empresa y administrar tu tienda.',
  );

  readonly token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
  readonly showPassword = signal(false);

  readonly invitation = this.invitationStore.invitation;
  readonly loading = this.invitationStore.loading;
  readonly accepting = this.invitationStore.accepting;
  readonly error = this.invitationStore.error;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  private readonly loadInvitation = this.token
    ? this.invitationStore.load(this.token)
    : this.invitationStore.invalidate();

  private readonly redirectWhenAccepted = effect(() => {
    const session = this.invitationStore.session();
    if (!session) return;
    this.authStore.setSession(session);
    void this.router.navigate(['/vendedor/inicio']);
  });

  accept(): void {
    if (this.form.invalid || this.accepting() || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    this.invitationStore.clearError();
    const { name, password } = this.form.getRawValue();
    this.invitationStore.accept({ token: this.token, data: { name, password } });
  }

  invalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
