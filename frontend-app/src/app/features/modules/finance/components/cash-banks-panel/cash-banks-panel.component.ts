import { Component, computed, input, output } from '@angular/core';
import { CashMoneyPipe } from '../../../../../shared/pipes/cash-money.pipe';
import {
  BANK_ACCOUNT_TYPES,
  type BankAccount,
  type BanksSummary,
} from '../../../../domains/banks/public-api';

/** Cuentas bancarias de la empresa dentro del centro de caja. */
@Component({
  selector: 'app-cash-banks-panel',
  standalone: true,
  imports: [CashMoneyPipe],
  templateUrl: './cash-banks-panel.component.html',
})
export class CashBanksPanelComponent {
  readonly accounts = input.required<readonly BankAccount[]>();
  readonly summary = input.required<BanksSummary>();

  readonly add = output<void>();
  readonly edit = output<BankAccount>();
  readonly remove = output<string>();

  readonly accountViews = computed(() =>
    this.accounts().map((account) => {
      const digits = account.accountNumber.replace(/\s/g, '');
      return {
        account,
        typeLabel:
          BANK_ACCOUNT_TYPES.find((item) => item.value === account.type)?.label ?? 'Cuenta',
        maskedNumber: digits.length > 4 ? `•••• ${digits.slice(-4)}` : account.accountNumber,
      };
    }),
  );
}
