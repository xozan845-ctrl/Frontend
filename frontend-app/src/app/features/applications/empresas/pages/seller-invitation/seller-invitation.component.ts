import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { COMPANY_INFO } from '../../../../../core/constants/company.constants';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { AuthStore } from '../../../auth/public-api';
import { SellerInvitationStore } from '../../state/seller-invitation/seller-invitation.store';

/** Formulario público para aceptar una invitación de vendedor. */
@Component({
  selector: 'app-seller-invitation',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './seller-invitation.component.html',
})
export default class SellerInvitationComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  readonly invitationStore = inject(SellerInvitationStore);
  private readonly seoService = injectSeoPage(
    'Tu tienda te espera',
    'Acepta la invitación, crea tu cuenta y empieza a vender con tu propia tienda.',
    '/og-invitacion.png',
  );

  /**
   * El token llega por la ruta corta (`/i/:token`) o por el enlace anterior
   * (`/registro/vendedor?token=`). La ruta corta tiene prioridad.
   */
  readonly token =
    this.route.snapshot.paramMap.get('token')?.trim() ||
    this.route.snapshot.queryParamMap.get('token')?.trim() ||
    '';

  readonly brandName = COMPANY_INFO.name;
  readonly currentYear = new Date().getFullYear();
  readonly showPassword = signal(false);

  readonly invitation = this.invitationStore.invitation;
  readonly loading = this.invitationStore.loading;
  readonly accepting = this.invitationStore.accepting;
  readonly error = this.invitationStore.error;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  private readonly passwordValue = toSignal(
    this.form.controls.password.valueChanges.pipe(startWith(this.form.controls.password.value)),
    { initialValue: this.form.controls.password.value },
  );

  readonly passwordChecks = computed(() => {
    const value = this.passwordValue();
    return {
      length: value.length >= 8,
      upper: /[A-ZÁÉÍÓÚÑ]/.test(value),
      number: /\d/.test(value),
      symbol: /[^A-Za-z0-9]/.test(value),
    };
  });

  readonly passwordScore = computed(
    () => Object.values(this.passwordChecks()).filter(Boolean).length,
  );

  readonly passwordStrengthLabel = computed(() => {
    const score = this.passwordScore();
    if (score <= 1) return 'Débil';
    if (score === 2) return 'Aceptable';
    if (score === 3) return 'Buena';
    return 'Fuerte';
  });

  readonly companyInitial = computed(
    () => this.invitation()?.companyName?.trim().charAt(0).toUpperCase() || 'Q',
  );

  readonly expiresInLabel = computed(() => {
    const raw = this.invitation()?.expiresAt;
    if (!raw) return '';

    const diff = new Date(raw).getTime() - Date.now();
    if (Number.isNaN(diff)) return '';
    if (diff <= 0) return 'Invitación vencida';

    const hours = Math.floor(diff / 3_600_000);
    if (hours < 24) return hours <= 1 ? 'Vence en menos de 1 hora' : `Vence en ${hours} horas`;

    const days = Math.ceil(diff / 86_400_000);
    return `Vence en ${days} ${days === 1 ? 'día' : 'días'}`;
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
