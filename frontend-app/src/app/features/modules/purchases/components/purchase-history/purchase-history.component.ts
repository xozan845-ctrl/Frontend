import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import {
  PURCHASE_PERIODS,
  PURCHASE_STATUS_FILTERS,
  type PurchaseHistoryRow,
  type PurchasePeriod,
  type PurchaseStatusFilter,
} from '../../../../domains/purchases/public-api';

const PERIOD_CLASSES = {
  active: 'bg-accent-600 text-white shadow-sm',
  idle: 'text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-surface-800 dark:hover:text-white',
} as const;

/** Historial de compras con periodo, estado, búsqueda y paginación. */
@Component({
  selector: 'app-purchase-history',
  standalone: true,
  imports: [NgClass, AppCurrencyPipe, AppDatePipe],
  templateUrl: './purchase-history.component.html',
})
export class PurchaseHistoryComponent {
  readonly rows = input.required<readonly PurchaseHistoryRow[]>();
  readonly filteredCount = input.required<number>();
  readonly period = input.required<PurchasePeriod>();
  readonly statusFilter = input.required<PurchaseStatusFilter>();
  readonly query = input.required<string>();
  readonly customFrom = input.required<string>();
  readonly customTo = input.required<string>();
  readonly page = input.required<number>();
  readonly pageCount = input.required<number>();
  readonly isFirstPage = input.required<boolean>();
  readonly isLastPage = input.required<boolean>();
  readonly isCustomPeriod = input.required<boolean>();

  readonly periodChange = output<PurchasePeriod>();
  readonly statusChange = output<PurchaseStatusFilter>();
  readonly searchChange = output<string>();
  readonly customFromChange = output<string>();
  readonly customToChange = output<string>();
  readonly previous = output<void>();
  readonly next = output<void>();
  readonly newPurchase = output<void>();
  readonly cancelPurchase = output<string>();
  readonly removePurchase = output<string>();

  readonly periods = PURCHASE_PERIODS;
  readonly statuses = PURCHASE_STATUS_FILTERS;

  periodClass(period: PurchasePeriod): string {
    const base =
      'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black tracking-widest uppercase transition-colors';
    return `${base} ${this.period() === period ? PERIOD_CLASSES.active : PERIOD_CLASSES.idle}`;
  }

  statusBadgeClass(status: PurchaseHistoryRow['status']): string {
    const base = 'badge ';
    if (status === 'recibida') return `${base}badge-success`;
    if (status === 'anulada') return `${base}badge-danger`;
    return `${base}badge-warning`;
  }

  onStatusChange(event: Event): void {
    this.statusChange.emit((event.target as HTMLSelectElement).value as PurchaseStatusFilter);
  }

  onSearch(event: Event): void {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }

  onCustomFrom(event: Event): void {
    this.customFromChange.emit((event.target as HTMLInputElement).value);
  }

  onCustomTo(event: Event): void {
    this.customToChange.emit((event.target as HTMLInputElement).value);
  }
}
