import {
  Component,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import {
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_TYPES,
  type CreateExpensePayload,
  type ExpensePaymentMethod,
  type ExpenseRecord,
  type ExpenseType,
} from '../../../../domains/expenses/public-api';

function todayInput(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Alta/edición de un gasto; presentacional (`R-SO-8`). */
@Component({
  selector: 'app-expense-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective],
  templateUrl: './expense-modal.component.html',
})
export class ExpenseModalComponent {
  readonly open = input(false);
  readonly expense = input<ExpenseRecord | null>(null);
  readonly categories = input<readonly { value: string; label: string }[]>([]);
  readonly error = input<string | null>(null);
  readonly save = output<CreateExpensePayload>();
  readonly closed = output<void>();

  readonly types = EXPENSE_TYPES;
  readonly paymentMethods = EXPENSE_PAYMENT_METHODS;
  readonly isEditing = computed(() => this.expense() !== null);
  readonly customCategory = signal(false);
  readonly hasIr = signal(false);
  readonly today = todayInput();
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    type: ['inmediato' as ExpenseType, Validators.required],
    category: ['publicidad', Validators.required],
    customCategory: [''],
    concept: ['', [Validators.required, Validators.maxLength(180)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['efectivo' as ExpensePaymentMethod, Validators.required],
    includesVat: [false],
    irRetention: [0, [Validators.min(0)]],
    date: [this.today, Validators.required],
    scheduledFor: [''],
    recurrence: [''],
    beneficiary: ['', Validators.maxLength(120)],
    notes: ['', Validators.maxLength(500)],
  });

  private readonly syncForm = effect(() => {
    if (!this.open()) return;
    const expense = this.expense();
    this.customCategory.set(false);
    this.hasIr.set((expense?.irRetention ?? 0) > 0);
    this.form.reset({
      type: expense?.type ?? 'inmediato',
      category: expense?.category ?? 'publicidad',
      customCategory: '',
      concept: expense?.concept ?? '',
      amount: expense?.amount ?? 0,
      paymentMethod: expense?.paymentMethod ?? 'efectivo',
      includesVat: expense?.includesVat ?? false,
      irRetention: expense?.irRetention ?? 0,
      date: expense?.date ?? this.today,
      scheduledFor: expense?.scheduledFor ?? '',
      recurrence: expense?.recurrence ?? '',
      beneficiary: expense?.beneficiary ?? '',
      notes: expense?.notes ?? '',
    });
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.closed.emit();
  }

  toggleCustomCategory(): void {
    this.customCategory.update((value) => !value);
    if (this.customCategory()) this.form.controls.customCategory.setValue('');
  }

  toggleIr(): void {
    this.hasIr.update((value) => !value);
    if (!this.hasIr()) this.form.controls.irRetention.setValue(0);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const category = this.customCategory() ? value.customCategory.trim() : value.category;
    if (!category) {
      this.form.controls.customCategory.markAsTouched();
      return;
    }
    this.save.emit({
      type: value.type,
      category,
      concept: value.concept.trim(),
      amount: Number(value.amount),
      paymentMethod: value.paymentMethod,
      includesVat: value.includesVat,
      irRetention: this.hasIr() ? Number(value.irRetention) : 0,
      date: value.date,
      scheduledFor: value.type === 'inmediato' ? '' : value.scheduledFor,
      recurrence: value.type === 'recurrente' ? value.recurrence.trim() : '',
      beneficiary: value.beneficiary.trim(),
      notes: value.notes.trim(),
    });
  }

  isInvalid(field: 'concept' | 'amount' | 'date' | 'customCategory'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }
}
