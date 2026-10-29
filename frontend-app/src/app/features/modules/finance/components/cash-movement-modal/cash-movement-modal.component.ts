import { NgClass } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import { CashMoneyPipe } from '../../../../../shared/pipes/cash-money.pipe';
import {
  CASH_MOVEMENT_CATEGORIES,
  CASH_MOVEMENT_TYPES,
  CASH_USD_RATE,
  cashToday,
  type CashMovementCategory,
  type CashMovementType,
  type CashPaymentMethod,
  type CreateCashMovementPayload,
} from '../../../../domains/finance/public-api';

const CATEGORIES_BY_TYPE: Readonly<Record<CashMovementType, readonly CashMovementCategory[]>> = {
  ingreso: ['venta', 'aporte', 'ajuste', 'otro'],
  egreso: ['compra', 'gasto', 'retiro', 'ajuste', 'otro'],
};

/** Alta de un movimiento manual de caja; presentacional (`R-SO-8`). */
@Component({
  selector: 'app-cash-movement-modal',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule, FocusTrapDirective, CashMoneyPipe],
  templateUrl: './cash-movement-modal.component.html',
})
export class CashMovementModalComponent {
  readonly open = input.required<boolean>();
  readonly methods = input.required<readonly CashPaymentMethod[]>();

  readonly dismiss = output<void>();
  readonly save = output<CreateCashMovementPayload>();

  readonly types = CASH_MOVEMENT_TYPES;
  readonly rate = CASH_USD_RATE;
  readonly usd = signal(false);
  readonly type = signal<CashMovementType>('ingreso');

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    date: [cashToday(), Validators.required],
    type: ['ingreso' as CashMovementType, Validators.required],
    category: ['venta' as CashMovementCategory, Validators.required],
    concept: ['', [Validators.required, Validators.maxLength(160)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['efectivo', Validators.required],
    observations: ['', Validators.maxLength(300)],
  });

  readonly categories = computed(() =>
    CASH_MOVEMENT_CATEGORIES.filter((category) =>
      CATEGORIES_BY_TYPE[this.type()].includes(category.value),
    ),
  );

  private readonly resetOnOpen = effect(() => {
    if (!this.open()) return;
    const firstMethod = this.methods().find((method) => method.active)?.id ?? 'efectivo';
    this.usd.set(false);
    this.type.set('ingreso');
    this.form.reset({
      date: cashToday(),
      type: 'ingreso',
      category: 'venta',
      concept: '',
      amount: 0,
      paymentMethod: firstMethod,
      observations: '',
    });
  });

  setType(type: CashMovementType): void {
    this.type.set(type);
    const allowed = CATEGORIES_BY_TYPE[type];
    const current = this.form.controls.category.value;
    this.form.controls.category.setValue(
      allowed.includes(current) ? current : type === 'ingreso' ? 'venta' : 'gasto',
    );
  }

  toggleUsd(): void {
    this.usd.update((value) => !value);
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
      category: value.category,
      concept: value.concept.trim(),
      amount: Number(value.amount),
      paymentMethod: value.paymentMethod,
      currency: this.usd() ? 'USD' : 'NIO',
      originalAmount: Number(value.amount),
      exchangeRate: this.usd() ? CASH_USD_RATE : 1,
      observations: value.observations.trim(),
    });
  }

  isInvalid(field: 'date' | 'concept' | 'amount'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }
}
