import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import {
  CASH_PAYMENT_METHOD_KINDS,
  type CreateCashPaymentMethodPayload,
} from '../../../../domains/finance/public-api';

/** Alta de un método de pago personalizado. */
@Component({
  selector: 'app-cash-method-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective],
  templateUrl: './cash-method-modal.component.html',
})
export class CashMethodModalComponent {
  readonly open = input.required<boolean>();

  readonly dismiss = output<void>();
  readonly save = output<CreateCashPaymentMethodPayload>();

  readonly kinds = CASH_PAYMENT_METHOD_KINDS;

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    kind: ['efectivo', Validators.required],
  });

  private readonly resetOnOpen = effect(() => {
    if (!this.open()) return;
    this.form.reset({ name: '', kind: 'efectivo' });
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.save.emit({ name: value.name.trim(), kind: value.kind });
  }

  isInvalid(): boolean {
    const control = this.form.controls.name;
    return control.invalid && (control.dirty || control.touched);
  }
}
