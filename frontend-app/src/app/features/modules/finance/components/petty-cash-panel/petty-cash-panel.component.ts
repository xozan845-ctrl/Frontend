import { Component, input, output } from '@angular/core';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import { CashMoneyPipe } from '../../../../../shared/pipes/cash-money.pipe';
import type {
  PettyCashFund,
  PettyCashMovement,
  PettyCashMovementType,
  PettyCashSummary,
} from '../../../../domains/finance/public-api';

/** Fondo fijo de caja chica y sus reposiciones/gastos. */
@Component({
  selector: 'app-petty-cash-panel',
  standalone: true,
  imports: [AppDatePipe, CashMoneyPipe],
  templateUrl: './petty-cash-panel.component.html',
})
export class PettyCashPanelComponent {
  readonly summary = input.required<PettyCashSummary>();
  readonly movements = input.required<readonly PettyCashMovement[]>();
  readonly fund = input.required<PettyCashFund>();

  readonly openFund = output<void>();
  readonly openMovement = output<PettyCashMovementType>();

  typeLabel(type: PettyCashMovementType): string {
    return type === 'gasto' ? 'Gasto' : 'Reposición';
  }
}
