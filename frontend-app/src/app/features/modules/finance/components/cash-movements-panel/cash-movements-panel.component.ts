import { NgClass } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import { CashMoneyPipe } from '../../../../../shared/pipes/cash-money.pipe';
import {
  CASH_MOVEMENT_CATEGORIES,
  CASH_PAGE_SIZE,
  CASH_PERIODS,
  type CashLedgerEntry,
  type CashMovementCategory,
  type CashPaymentMethod,
  type CashPeriod,
} from '../../../../domains/finance/public-api';

const BADGE_BY_CATEGORY: Readonly<Record<CashMovementCategory, string>> = {
  venta: 'badge badge-success',
  compra: 'badge badge-warning',
  gasto: 'badge badge-danger',
  aporte: 'badge badge-success',
  retiro: 'badge badge-danger',
  ajuste: 'badge badge-neutral',
  transferencia: 'badge badge-primary',
  otro: 'badge badge-neutral',
};

/** Libro de caja paginado con filtros de periodo y búsqueda. */
@Component({
  selector: 'app-cash-movements-panel',
  standalone: true,
  imports: [NgClass, AppDatePipe, CashMoneyPipe],
  templateUrl: './cash-movements-panel.component.html',
})
export class CashMovementsPanelComponent {
  readonly rows = input.required<readonly CashLedgerEntry[]>();
  readonly page = input.required<number>();
  readonly pageCount = input.required<number>();
  readonly total = input.required<number>();
  readonly period = input.required<CashPeriod>();
  readonly search = input.required<string>();
  readonly methods = input<readonly CashPaymentMethod[]>([]);

  readonly create = output<void>();
  readonly periodChange = output<CashPeriod>();
  readonly searchChange = output<string>();
  readonly nextPage = output<void>();
  readonly previousPage = output<void>();
  readonly annul = output<string>();

  readonly periods = CASH_PERIODS;
  readonly categoryLabels = Object.fromEntries(
    CASH_MOVEMENT_CATEGORIES.map((category) => [category.value, category.label]),
  ) as Record<CashMovementCategory, string>;
  readonly categoryBadges = BADGE_BY_CATEGORY;
  readonly methodLabels = computed(
    () => new Map(this.methods().map((method) => [method.id, method.name])),
  );
  readonly rangeStart = computed(() =>
    this.total() === 0 ? 0 : (this.page() - 1) * CASH_PAGE_SIZE + 1,
  );
  readonly rangeEnd = computed(() => Math.min(this.page() * CASH_PAGE_SIZE, this.total()));

  onSearch(event: Event): void {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }

  onPeriod(period: CashPeriod): void {
    this.periodChange.emit(period);
  }

  periodClass(period: CashPeriod): string {
    const base =
      'inline-flex items-center rounded-xl px-3 py-2 text-[10px] font-black tracking-widest uppercase transition-colors';
    return this.period() === period
      ? `${base} bg-accent-600 text-white shadow-sm`
      : `${base} text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-surface-800 dark:hover:text-white`;
  }
}
