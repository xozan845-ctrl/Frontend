import { Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LogisticsCompanyStore } from '../../state/logistics-company/logistics-company.store';

@Component({
  selector: 'app-logistics-company-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './logistics-company-onboarding.component.html',
})
export default class LogisticsCompanyOnboardingComponent {
  readonly store = inject(LogisticsCompanyStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    slug: ['', [Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
  });

  private readonly navigateAfterCreate = effect(() => {
    if (this.store.company()) void this.router.navigateByUrl('/logistica/dashboard');
  });

  submit(): void {
    if (this.form.invalid || this.store.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.create(this.form.getRawValue());
  }
}
