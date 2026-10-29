import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import {
  cashToday,
  type CreatePettyCashMovementPayload,
  type PettyCashFund,
  type PettyCashMovementType,
} from '../../../../domains/finance/public-api';

export type PettyCashModalMode = 'movement' | 'fund';

/** Alta de movimientos o ajuste del fondo de caja chica. */
@Component({
  selector: 'app-petty-cash-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective],
  templateUrl: './petty-cash-modal.component.html',
})
export class PettyCashModalComponent {
  readonly open = input.required<boolean>();
  readonly mode = input<PettyCashModalMode>('movement');
  readonly defaultType = input<PettyCashMovementType>('gasto');
  readonly fund = input.required<PettyCashFund>();

  readonly type = signal<PettyCashMovementType>('gasto');

  readonly dismiss = output<void>();
  readonly saveMovement = output<CreatePettyCashMovementPayload>();
  readonly saveFund = output<{ amount: number; responsible: string }>();

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    type: ['gasto' as PettyCashMovementType, Validators.required],
    date: [cashToday(), Validators.required],
    concept: ['', [Validators.required, Validators.maxLength(160)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    responsible: ['', Validators.maxLength(80)],
  });

  private readonly resetOnOpen = effect(() => {
    if (!this.open()) return;
    const amount = this.form.controls.amount;
    amount.setValidators(
      this.mode() === 'fund'
        ? [Validators.required, Validators.min(0)]
        : [Validators.required, Validators.min(0.01)],
    );
    amount.updateValueAndValidity({ emitEvent: false });
    this.type.set(this.defaultType());
    this.form.reset({
      type: this.defaultType(),
      date: cashToday(),
      concept: '',
      amount: this.mode() === 'fund' ? this.fund().amount : 0,
      responsible: this.fund().responsible,
    });
  });

  setType(type: PettyCashMovementType): void {
    this.type.set(type);
  }

  submit(): void {
    if (this.mode() === 'fund') {
      const amount = this.form.controls.amount;
      if (amount.invalid) {
        amount.markAsTouched();
        return;
      }
      const value = this.form.getRawValue();
      this.saveFund.emit({ amount: Number(value.amount), responsible: value.responsible.trim() });
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saveMovement.emit({
      date: value.date,
      type: value.type,
      concept: value.concept.trim(),
      amount: Number(value.amount),
    });
  }

  isInvalid(field: 'date' | 'concept' | 'amount'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }
}
