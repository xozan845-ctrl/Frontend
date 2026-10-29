import { Component, input, output } from '@angular/core';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import { CashMoneyPipe } from '../../../../../shared/pipes/cash-money.pipe';
import type { CashTransfer, CashTransferSummary } from '../../../../domains/finance/public-api';

/** Transferencias internas entre caja y cuentas bancarias. */
@Component({
  selector: 'app-cash-transfers-panel',
  standalone: true,
  imports: [AppDatePipe, CashMoneyPipe],
  templateUrl: './cash-transfers-panel.component.html',
})
export class CashTransfersPanelComponent {
  readonly transfers = input.required<readonly CashTransfer[]>();
  readonly summary = input.required<CashTransferSummary>();

  readonly requestCreate = output<void>();
  readonly requestCancel = output<string>();
}
