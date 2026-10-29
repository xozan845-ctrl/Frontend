import { Component, input, output } from '@angular/core';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import { CashMoneyPipe } from '../../../../../shared/pipes/cash-money.pipe';
import type { CashClosure, CashClosurePreview } from '../../../../domains/finance/public-api';

/** Arqueo y cierres diarios de la caja. */
@Component({
  selector: 'app-cash-closures-panel',
  standalone: true,
  imports: [AppDatePipe, CashMoneyPipe],
  templateUrl: './cash-closures-panel.component.html',
})
export class CashClosuresPanelComponent {
  readonly preview = input.required<CashClosurePreview>();
  readonly closures = input.required<readonly CashClosure[]>();

  readonly requestClose = output<void>();

  differenceClass(value: number): string {
    if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-slate-500 dark:text-slate-400';
  }
}
