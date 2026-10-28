import { Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { CreatePayablePayload } from '../../../../domains/payables/public-api';

function inThirtyDays(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Alta de una cuenta por pagar; presentacional (`R-SO-8`). */
@Component({
  selector: 'app-payable-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './payable-form.component.html',
})
export class PayableFormComponent {
  readonly create = output<CreatePayablePayload>();
  readonly defaultDueDate = inThirtyDays();
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    supplier: ['', [Validators.required, Validators.maxLength(120)]],
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
    this.create.emit({
      supplier: value.supplier.trim(),
      concept: value.concept.trim(),
      dueDate: value.dueDate,
      amount: Number(value.amount),
    });
    this.form.reset({
      supplier: '',
      concept: '',
      dueDate: this.defaultDueDate,
      amount: 0,
    });
  }

  isInvalid(field: 'supplier' | 'concept' | 'dueDate' | 'amount'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }
}
