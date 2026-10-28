import { Component, inject, effect, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../state/auth/auth.store';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-form.component.html',
})
export class RegisterFormComponent {
  private readonly fb = inject(FormBuilder);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  /** Alta pedida desde el funnel de vendedor (`rol=seller`, ADR-22). */
  readonly isSellerIntent = this.route.snapshot.queryParamMap.get('rol') === 'seller';
  /** Alta pedida desde el acceso de facturación (`rol=biller`, ADR-24). */
  readonly isBillerIntent = this.route.snapshot.queryParamMap.get('rol') === 'biller';
  /** Título y subtítulo según la intención del alta. */
  readonly heading = this.isBillerIntent
    ? 'Facturador'
    : this.isSellerIntent
      ? 'Vendedor'
      : 'Registro';
  readonly subheading = this.isBillerIntent
    ? 'Crear cuenta de facturador'
    : this.isSellerIntent
      ? 'Crear cuenta de vendedor'
      : 'Crear nueva cuenta';
  /** Rol que se envía al registrar según el origen del alta. */
  private readonly roleToRegister: 'seller' | 'biller' | undefined = this.isBillerIntent
    ? 'biller'
    : this.isSellerIntent
      ? 'seller'
      : undefined;

  private readonly seoService = injectSeoPage(
    this.isBillerIntent
      ? 'Cuenta de facturador'
      : this.isSellerIntent
        ? 'Cuenta de vendedor'
        : 'Crear cuenta',
    this.isBillerIntent
      ? 'Crea tu cuenta de facturador para emitir facturas desde tu tienda.'
      : this.isSellerIntent
        ? 'Crea tu cuenta de vendedor para abrir tu tienda.'
        : 'Regístrate en Quantum Store.',
  );

  readonly registerForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  showPassword = signal(false);

  /** Redirige al usuario autenticado según el origen del alta (`R-AR-15`). */
  private readonly redirectWhenAuthenticated = effect(() => {
    if (this.authStore.isAuthenticated()) {
      this.redirectAfterAuth();
    }
  });

  /** Vuelve a la ruta protegida de origen (`returnUrl`) o al destino de la intención. */
  private redirectAfterAuth(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const fallback = this.isBillerIntent
      ? '/facturacion/nueva'
      : this.isSellerIntent
        ? '/crear-empresa'
        : '/';
    const safeUrl = returnUrl && returnUrl.startsWith('/') ? returnUrl : fallback;
    this.router.navigateByUrl(safeUrl);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const { name, email, password } = this.registerForm.value;
      if (name && email && password) {
        this.authStore.register({
          name,
          email,
          password,
          ...(this.roleToRegister ? { role: this.roleToRegister } : {}),
        });
      }
    }
  }
}
export default RegisterFormComponent;
