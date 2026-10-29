import { NgClass } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import { CashMoneyPipe } from '../../../../../shared/pipes/cash-money.pipe';
import type {
  CashClosurePreview,
  CreateCashClosurePayload,
} from '../../../../domains/finance/public-api';

/** Arqueo de cierre: efectivo contado contra el saldo esperado. */
@Component({
  selector: 'app-cash-closure-modal',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule, FocusTrapDirective, CashMoneyPipe],
  templateUrl: './cash-closure-modal.component.html',
})
export class CashClosureModalComponent {
  readonly open = input.required<boolean>();
  readonly preview = input.required<CashClosurePreview>();

  readonly dismiss = output<void>();
  readonly save = output<CreateCashClosurePayload>();

  readonly counted = signal(0);
  readonly difference = computed(
    () => Math.round((this.counted() - this.preview().expectedBalance) * 100) / 100,
  );

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    countedBalance: [0, [Validators.required, Validators.min(0)]],
    notes: ['', Validators.maxLength(300)],
  });

  private readonly resetOnOpen = effect(() => {
    if (!this.open()) return;
    this.counted.set(this.preview().expectedBalance);
    this.form.reset({ countedBalance: this.preview().expectedBalance, notes: '' });
  });

  onCounted(event: Event): void {
    this.counted.set(Number((event.target as HTMLInputElement).value));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.save.emit({
      date: this.preview().date,
      countedBalance: Number(value.countedBalance),
      notes: value.notes.trim(),
    });
  }

  differenceClass(): string {
    if (this.difference() > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (this.difference() < 0) return 'text-red-600 dark:text-red-400';
    return 'text-slate-500 dark:text-slate-400';
  }
}
