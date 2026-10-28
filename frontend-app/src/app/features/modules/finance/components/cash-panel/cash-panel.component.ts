import { Component, computed, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import {
  CASH_MOVEMENT_TYPES,
  PAYMENT_METHODS,
  type CashMovement,
  type CashMovementType,
  type CreateCashMovementPayload,
  type PaymentMethod,
} from '../../../../domains/finance/public-api';

function todayInput(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Movimientos y saldo de caja; no conoce el store (`R-SO-8`). */
@Component({
  selector: 'app-cash-panel',
  standalone: true,
  imports: [ReactiveFormsModule, AppCurrencyPipe, AppDatePipe],
  templateUrl: './cash-panel.component.html',
})
export class CashPanelComponent {
  readonly records = input.required<readonly CashMovement[]>();
  readonly create = output<CreateCashMovementPayload>();
  readonly remove = output<string>();

  readonly types = CASH_MOVEMENT_TYPES;
  readonly methods = PAYMENT_METHODS;
  readonly methodLabels: Readonly<Record<PaymentMethod, string>> = Object.fromEntries(
    PAYMENT_METHODS.map((method) => [method.value, method.label]),
  ) as Record<PaymentMethod, string>;
  readonly today = todayInput();
  readonly balance = computed(() =>
    this.records().reduce(
      (total, movement) =>
        movement.type === 'ingreso' ? total + movement.amount : total - movement.amount,
      0,
    ),
  );

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    date: [this.today, Validators.required],
    type: ['ingreso' as CashMovementType, Validators.required],
    concept: ['', [Validators.required, Validators.maxLength(160)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['efectivo' as PaymentMethod, Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.create.emit({
      date: value.date,
      type: value.type,
      concept: value.concept.trim(),
      amount: Number(value.amount),
      paymentMethod: value.paymentMethod,
    });
    this.form.reset({
      date: this.today,
      type: 'ingreso',
      concept: '',
      amount: 0,
      paymentMethod: 'efectivo',
    });
  }

  isInvalid(field: 'date' | 'concept' | 'amount'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }
}
