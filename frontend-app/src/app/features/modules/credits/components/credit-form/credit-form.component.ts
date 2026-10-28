import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { CreateCreditPayload } from '../../../../domains/credits/public-api';

function inThirtyDays(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Alta de un crédito; presentacional (`R-SO-8`). */
@Component({
  selector: 'app-credit-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './credit-form.component.html',
})
export class CreditFormComponent {
  readonly error = input<string | null>(null);
  readonly createCredit = output<CreateCreditPayload>();

  readonly defaultDueDate = inThirtyDays();
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    customer: ['', [Validators.required, Validators.maxLength(120)]],
    concept: ['', [Validators.required, Validators.maxLength(160)]],
    dueDate: [this.defaultDueDate, Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.createCredit.emit({
      customer: value.customer.trim(),
      concept: value.concept.trim(),
      dueDate: value.dueDate,
      amount: Number(value.amount),
    });
    this.form.reset({
      customer: '',
      concept: '',
      dueDate: this.defaultDueDate,
      amount: 0,
    });
  }

  isInvalid(field: 'customer' | 'concept' | 'dueDate' | 'amount'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }
}
