import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  type CreateExpensePayload,
  type ExpenseCategory,
  type ExpenseRecord,
  type PaymentMethod,
} from '../../../../domains/finance/public-api';

function todayInput(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Alta y listado de gastos; no conoce el store (`R-SO-8`). */
@Component({
  selector: 'app-expense-panel',
  standalone: true,
  imports: [ReactiveFormsModule, AppCurrencyPipe, AppDatePipe],
  templateUrl: './expense-panel.component.html',
})
export class ExpensePanelComponent {
  readonly records = input.required<readonly ExpenseRecord[]>();
  readonly create = output<CreateExpensePayload>();
  readonly remove = output<string>();

  readonly categories = EXPENSE_CATEGORIES;
  readonly methods = PAYMENT_METHODS;
  readonly categoryLabels: Readonly<Record<ExpenseCategory, string>> = Object.fromEntries(
    EXPENSE_CATEGORIES.map((category) => [category.value, category.label]),
  ) as Record<ExpenseCategory, string>;
  readonly methodLabels: Readonly<Record<PaymentMethod, string>> = Object.fromEntries(
    PAYMENT_METHODS.map((method) => [method.value, method.label]),
  ) as Record<PaymentMethod, string>;
  readonly today = todayInput();
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    date: [this.today, Validators.required],
    category: ['operativo' as ExpenseCategory, Validators.required],
    description: ['', [Validators.required, Validators.maxLength(160)]],
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
      category: value.category,
      description: value.description.trim(),
      amount: Number(value.amount),
      paymentMethod: value.paymentMethod,
    });
    this.form.reset({
      date: this.today,
      category: 'operativo',
      description: '',
      amount: 0,
      paymentMethod: 'efectivo',
    });
  }

  isInvalid(field: 'date' | 'description' | 'amount'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }
}
