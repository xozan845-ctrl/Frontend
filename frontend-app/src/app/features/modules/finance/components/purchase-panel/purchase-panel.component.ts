import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import {
  PURCHASE_STATUSES,
  type CreatePurchasePayload,
  type PurchaseRecord,
  type PurchaseStatus,
} from '../../../../domains/finance/public-api';

function todayInput(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Alta y listado de compras; no conoce el store (`R-SO-8`). */
@Component({
  selector: 'app-purchase-panel',
  standalone: true,
  imports: [ReactiveFormsModule, AppCurrencyPipe, AppDatePipe],
  templateUrl: './purchase-panel.component.html',
})
export class PurchasePanelComponent {
  readonly records = input.required<readonly PurchaseRecord[]>();
  readonly create = output<CreatePurchasePayload>();
  readonly remove = output<string>();

  readonly statuses = PURCHASE_STATUSES;
  readonly today = todayInput();
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    date: [this.today, Validators.required],
    supplier: ['', [Validators.required, Validators.maxLength(120)]],
    concept: ['', [Validators.required, Validators.maxLength(160)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    status: ['pendiente' as PurchaseStatus, Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.create.emit({
      date: value.date,
      supplier: value.supplier.trim(),
      concept: value.concept.trim(),
      amount: Number(value.amount),
      status: value.status,
    });
    this.form.reset({
      date: this.today,
      supplier: '',
      concept: '',
      amount: 0,
      status: 'pendiente',
    });
  }

  isInvalid(field: 'date' | 'supplier' | 'concept' | 'amount'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }
}
