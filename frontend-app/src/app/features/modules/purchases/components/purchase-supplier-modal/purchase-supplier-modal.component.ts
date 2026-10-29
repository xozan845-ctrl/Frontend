import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import type { CreateSupplierInput } from '../../../../domains/purchases/public-api';

/** Alta rápida de proveedor. */
@Component({
  selector: 'app-purchase-supplier-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective],
  templateUrl: './purchase-supplier-modal.component.html',
})
export class PurchaseSupplierModalComponent {
  readonly open = input.required<boolean>();
  readonly error = input<string | null>(null);

  readonly dismiss = output<void>();
  readonly save = output<CreateSupplierInput>();

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    ruc: ['', Validators.maxLength(40)],
    phone: ['', Validators.maxLength(40)],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    address: ['', Validators.maxLength(160)],
  });

  private readonly resetOnOpen = effect(() => {
    if (!this.open()) return;
    this.form.reset({
      name: '',
      ruc: '',
      phone: '',
      email: '',
      address: '',
    });
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.save.emit({
      name: value.name.trim(),
      ruc: value.ruc.trim(),
      phone: value.phone.trim(),
      email: value.email.trim(),
      address: value.address.trim(),
    });
  }
}
