import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import { CashMoneyPipe } from '../../../../../shared/pipes/cash-money.pipe';
import {
  cashToday,
  type CashTransferAccount,
  type CreateCashTransferPayload,
} from '../../../../domains/finance/public-api';

/** Transferencia interna entre caja y cuentas bancarias. */
@Component({
  selector: 'app-cash-transfer-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective, CashMoneyPipe],
  templateUrl: './cash-transfer-modal.component.html',
})
export class CashTransferModalComponent {
  readonly open = input.required<boolean>();
  readonly accounts = input.required<readonly CashTransferAccount[]>();

  readonly dismiss = output<void>();
  readonly save = output<CreateCashTransferPayload>();

  readonly fromId = signal('');
  readonly toId = signal('');
  readonly error = signal<string | null>(null);
  readonly fromAccount = computed(
    () => this.accounts().find((account) => account.id === this.fromId()) ?? null,
  );
  readonly toAccount = computed(
    () => this.accounts().find((account) => account.id === this.toId()) ?? null,
  );

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    date: [cashToday(), Validators.required],
    fromId: ['', Validators.required],
    toId: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    concept: ['Transferencia interna', [Validators.required, Validators.maxLength(160)]],
    notes: ['', Validators.maxLength(300)],
  });

  private readonly resetOnOpen = effect(() => {
    if (!this.open()) return;
    const accounts = untracked(() => this.accounts());
    const from = accounts[0]?.id ?? '';
    const to = accounts[1]?.id ?? accounts[0]?.id ?? '';
    this.fromId.set(from);
    this.toId.set(to);
    this.error.set(null);
    this.form.reset({
      date: cashToday(),
      fromId: from,
      toId: to,
      amount: 0,
      concept: 'Transferencia interna',
      notes: '',
    });
  });

  setFrom(id: string): void {
    this.fromId.set(id);
    this.form.controls.fromId.setValue(id);
  }

  setTo(id: string): void {
    this.toId.set(id);
    this.form.controls.toId.setValue(id);
  }

  submit(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const from = this.fromAccount();
    const to = this.toAccount();
    if (!from || !to || from.id === to.id) {
      this.error.set('Elige dos cuentas distintas para transferir.');
      return;
    }
    if (Number(value.amount) > from.balance) {
      this.error.set(`Saldo insuficiente en ${from.label}.`);
      return;
    }
    this.save.emit({
      date: value.date,
      fromId: from.id,
      fromLabel: from.label,
      fromKind: from.kind,
      toId: to.id,
      toLabel: to.label,
      toKind: to.kind,
      amount: Number(value.amount),
      concept: value.concept.trim(),
      notes: value.notes.trim(),
    });
  }

  isInvalid(field: 'amount' | 'concept'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }
}
