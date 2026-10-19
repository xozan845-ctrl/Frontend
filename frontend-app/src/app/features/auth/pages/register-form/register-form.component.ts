import { Component, inject, effect, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../state/auth.store';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-form.component.html',
})
export class RegisterFormComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);
  /** Alta pedida desde el funnel de vendedor (`rol=seller`, ADR-22). */
  readonly isSellerIntent = this.route.snapshot.queryParamMap.get('rol') === 'seller';

  readonly registerForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  showPassword = signal(false);

  constructor() {
    this.seoService.setPage(
      this.isSellerIntent ? 'Cuenta de vendedor' : 'Crear cuenta',
      this.isSellerIntent
        ? 'Crea tu cuenta de vendedor para abrir tu tienda.'
        : 'Regístrate en Quantum Store.',
    );

    effect(() => {
      if (this.authStore.isAuthenticated()) {
        this.redirectAfterAuth();
      }
    });
  }

  /** Vuelve a la ruta protegida de origen (`returnUrl`) o a la entrada raíz. */
  private redirectAfterAuth(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const safeUrl = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/';
    this.router.navigateByUrl(safeUrl);
  }

  ngOnDestroy(): void {
    this.seoService.reset();
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
          ...(this.isSellerIntent ? { role: 'seller' as const } : {}),
        });
      }
    }
  }
}
export default RegisterFormComponent;
