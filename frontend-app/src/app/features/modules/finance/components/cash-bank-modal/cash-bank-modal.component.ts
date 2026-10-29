import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import {
  BANK_ACCOUNT_TYPES,
  type BankAccount,
  type BankAccountType,
  type CreateBankAccountPayload,
} from '../../../../domains/banks/public-api';

/** Alta/edición de una cuenta bancaria desde el centro de caja. */
@Component({
  selector: 'app-cash-bank-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FocusTrapDirective],
  templateUrl: './cash-bank-modal.component.html',
})
export class CashBankModalComponent {
  readonly open = input.required<boolean>();
  readonly account = input<BankAccount | null>(null);

  readonly dismiss = output<void>();
  readonly save = output<CreateBankAccountPayload>();

  readonly types = BANK_ACCOUNT_TYPES;

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    bank: ['', [Validators.required, Validators.maxLength(120)]],
    alias: ['', [Validators.required, Validators.maxLength(80)]],
    accountNumber: ['', [Validators.required, Validators.maxLength(40)]],
    type: ['ahorro' as BankAccountType, Validators.required],
    balance: [0, [Validators.required, Validators.min(0)]],
  });

  private readonly resetOnOpen = effect(() => {
    if (!this.open()) return;
    const account = this.account();
    this.form.reset({
      bank: account?.bank ?? '',
      alias: account?.alias ?? '',
      accountNumber: account?.accountNumber ?? '',
      type: account?.type ?? 'ahorro',
      balance: account?.balance ?? 0,
    });
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.save.emit({
      bank: value.bank.trim(),
      alias: value.alias.trim(),
      accountNumber: value.accountNumber.trim(),
      type: value.type,
      balance: Number(value.balance),
    });
  }

  isInvalid(field: 'bank' | 'alias' | 'accountNumber' | 'balance'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }
}
