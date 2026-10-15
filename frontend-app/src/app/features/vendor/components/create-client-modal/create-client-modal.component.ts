import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../shared/directives/focus-trap.directive';
import { CreateClientPayload } from '../../models/vendor-order.model';

/**
 * Alta rápida de cliente del POS (`R-AR-7`): modal accesible con `focus-trap`
 * (`R-AC-3`), formulario reactivo con validación mínima y estados de envío y
 * error. No conoce stores: emite el payload que resuelve la página.
 */
@Component({
  selector: 'app-create-client-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective],
  templateUrl: './create-client-modal.component.html',
})
export class CreateClientModalComponent {
  readonly open = input(false);
  readonly creating = input(false);
  readonly error = input<string | null>(null);
  readonly submitClient = output<CreateClientPayload>();
  readonly dismiss = output<void>();

  private readonly formBuilder = inject(FormBuilder);
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    phone: [''],
    email: ['', [Validators.email]],
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        this.form.reset({ name: '', phone: '', email: '' });
      }
    });
  }

  submitForm(): void {
    if (this.form.invalid || this.creating()) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, phone, email } = this.form.getRawValue();
    this.submitClient.emit({ name: name.trim(), phone: phone.trim(), email: email.trim() });
  }

  isInvalid(field: 'name' | 'phone' | 'email'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }
}
