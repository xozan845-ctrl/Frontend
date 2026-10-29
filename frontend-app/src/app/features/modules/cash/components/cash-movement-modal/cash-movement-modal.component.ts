import { Component, HostListener, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import {
  CASH_ACCOUNTS,
  CASH_CATEGORIES,
  CASH_MOVEMENT_TYPES,
  CASH_PAYMENT_METHODS,
  type CashMovement,
  type CashMovementCategory,
  type CashMovementType,
  type CashPaymentMethod,
  type CreateCashMovementPayload,
} from '../../../../domains/cash/public-api';

function todayInput(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Alta/edición de un movimiento de caja; presentacional (`R-SO-8`). */
@Component({
  selector: 'app-cash-movement-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective],
  templateUrl: './cash-movement-modal.component.html',
})
export class CashMovementModalComponent {
  readonly open = input(false);
  readonly movement = input<CashMovement | null>(null);
  readonly preset = input<Partial<CreateCashMovementPayload> | null>(null);
  readonly error = input<string | null>(null);
  readonly save = output<CreateCashMovementPayload>();
  readonly closed = output<void>();

  readonly types = CASH_MOVEMENT_TYPES;
  readonly categories = CASH_CATEGORIES;
  readonly paymentMethods = CASH_PAYMENT_METHODS;
  readonly accounts = CASH_ACCOUNTS;
  readonly isEditing = computed(() => this.movement() !== null);
  readonly today = todayInput();
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    type: ['ingreso' as CashMovementType, Validators.required],
    concept: ['', [Validators.required, Validators.maxLength(180)]],
    category: ['venta' as CashMovementCategory, Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['efectivo' as CashPaymentMethod, Validators.required],
    account: ['caja-general', Validators.required],
    date: [this.today, Validators.required],
    reference: ['', Validators.maxLength(80)],
    counterpart: ['', Validators.maxLength(120)],
    notes: ['', Validators.maxLength(500)],
  });

  private readonly syncForm = effect(() => {
    if (!this.open()) return;
    const movement = this.movement();
    const preset = this.preset();
    this.form.reset({
      type: movement?.type ?? preset?.type ?? 'ingreso',
      concept: movement?.concept ?? '',
      category: movement?.category ?? preset?.category ?? 'venta',
      amount: movement?.amount ?? 0,
      paymentMethod: movement?.paymentMethod ?? preset?.paymentMethod ?? 'efectivo',
      account: movement?.account ?? preset?.account ?? 'caja-general',
      date: movement?.date ?? preset?.date ?? this.today,
      reference: movement?.reference ?? '',
      counterpart: movement?.counterpart ?? '',
      notes: movement?.notes ?? '',
    });
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.closed.emit();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.save.emit({
      date: value.date,
      type: value.type,
      concept: value.concept.trim(),
      category: value.category,
      amount: Number(value.amount),
      paymentMethod: value.paymentMethod,
      account: value.account,
      reference: value.reference.trim(),
      counterpart: value.counterpart.trim(),
      notes: value.notes.trim(),
    });
  }

  isInvalid(field: 'concept' | 'amount' | 'date'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  selectType(type: CashMovementType): void {
    this.form.controls.type.setValue(type);
    if (type === 'ingreso' && this.form.controls.category.value === 'gasto') {
      this.form.controls.category.setValue('venta');
    }
    if (type === 'egreso' && this.form.controls.category.value === 'venta') {
      this.form.controls.category.setValue('gasto');
    }
  }
}
