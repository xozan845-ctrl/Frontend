import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../shared/directives/focus-trap.directive';
import type { CreateClientPayload } from '../../models/client.model';

/**
 * Alta manual de un cliente de la empresa. Modal accesible con `focus-trap`
 * (`R-AC-3`), formulario reactivo y salida del payload; no conoce stores.
 */
@Component({
  selector: 'app-client-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective],
  templateUrl: './client-modal.component.html',
})
export class ClientModalComponent {
  readonly open = input(false);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly submitClient = output<CreateClientPayload>();
  readonly dismiss = output<void>();

  private readonly formBuilder = inject(FormBuilder);
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    phone: ['', [Validators.maxLength(30)]],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    company: ['', [Validators.maxLength(100)]],
  });

  /** Limpia el formulario cada vez que se abre el modal (`R-AR-15`). */
  private readonly resetOnOpen = effect(() => {
    if (this.open()) {
      this.form.reset({ name: '', phone: '', email: '', company: '' });
    }
  });

  submitForm(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, phone, email, company } = this.form.getRawValue();
    this.submitClient.emit({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      company: company.trim(),
    });
  }

  isInvalid(field: 'name' | 'phone' | 'email' | 'company'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }
}
