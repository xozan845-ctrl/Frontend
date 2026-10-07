import { Component, inject, effect, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../state/auth.store';
import { SeoService } from '../../../../shared/services/seo.service';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-form.component.html',
  styles: [],
})
export class RegisterFormComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);

  readonly registerForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  showPassword = signal(false);

  constructor() {
    this.seoService.setPage('Crear cuenta', 'Regístrate en Quantum Store.');

    effect(() => {
      if (this.authStore.isAuthenticated()) {
        this.router.navigate(['/shop']);
      }
    });
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
        this.authStore.register({ name, email, password });
      }
    }
  }
}
export default RegisterFormComponent;
