import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  BANK_ACCOUNT_TYPES,
  type BankAccount,
  type BankAccountType,
  type CreateBankAccountPayload,
} from '../../../../domains/banks/public-api';

/** Alta/edición de una cuenta bancaria; presentacional (`R-SO-8`). */
@Component({
  selector: 'app-bank-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './bank-form.component.html',
})
export class BankFormComponent {
  readonly account = input<BankAccount | null>(null);
  readonly saveAccount = output<CreateBankAccountPayload>();
  readonly cancelEdit = output<void>();

  readonly types = BANK_ACCOUNT_TYPES;
  readonly isEditing = computed(() => this.account() !== null);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    bank: ['', [Validators.required, Validators.maxLength(120)]],
    alias: ['', [Validators.required, Validators.maxLength(80)]],
    accountNumber: ['', [Validators.required, Validators.maxLength(40)]],
    type: ['ahorro' as BankAccountType, Validators.required],
    balance: [0, [Validators.required, Validators.min(0)]],
  });

  private readonly syncForm = effect(() => {
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
    this.saveAccount.emit({
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
