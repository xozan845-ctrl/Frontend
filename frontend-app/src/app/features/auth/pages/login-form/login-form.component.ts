import { Component, inject, effect, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../state/auth.store';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-form.component.html',
})
export class LoginFormComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  showPassword = signal(false);

  constructor() {
    this.seoService.setPage('Iniciar sesión', 'Accede a tu cuenta de Quantum Store.');

    // Redirige al usuario autenticado (a `returnUrl` o a la entrada multi-tienda).
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
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      if (email && password) {
        this.authStore.login({ email, password });
      }
    }
  }
}
export default LoginFormComponent;
