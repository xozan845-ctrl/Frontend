import { Component, HostListener, computed, input, output, signal } from '@angular/core';
import { CashMoneyPipe } from '../../../../../shared/pipes/cash-money.pipe';
import {
  CASH_PAYMENT_METHODS,
  CASH_PERIODS,
  filterCashMovements,
  type CashFilters,
  type CashMovement,
  type CashMovementStatus,
  type CashMovementType,
  type CashPaymentMethod,
  type CashPeriod,
  type CashReportExport,
} from '../../../../domains/cash/public-api';

/** Modal de reporte de caja; filtra y delega la descarga al contenedor. */
@Component({
  selector: 'app-cash-report-modal',
  standalone: true,
  imports: [CashMoneyPipe],
  templateUrl: './cash-report-modal.component.html',
})
export class CashReportModalComponent {
  readonly open = input(false);
  readonly records = input<readonly CashMovement[]>([]);
  readonly closed = output<void>();
  readonly exportReport = output<CashReportExport>();

  readonly periods = CASH_PERIODS;
  readonly paymentMethods = CASH_PAYMENT_METHODS;
  readonly typeFilters: readonly { value: 'all' | CashMovementType; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'ingreso', label: 'Ingresos' },
    { value: 'egreso', label: 'Egresos' },
  ];
  readonly statusFilters: readonly { value: 'all' | CashMovementStatus; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'confirmado', label: 'Confirmados' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'anulado', label: 'Anulados' },
  ];

  readonly period = signal<CashPeriod>('month');
  readonly type = signal<'all' | CashMovementType>('all');
  readonly status = signal<'all' | CashMovementStatus>('all');
  readonly paymentMethod = signal<'all' | CashPaymentMethod>('all');
  readonly search = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');

  readonly filtered = computed(() =>
    filterCashMovements(this.records(), {
      period: this.period(),
      type: this.type(),
      status: this.status(),
      category: 'all',
      paymentMethod: this.paymentMethod(),
      search: this.search(),
      dateFrom: this.dateFrom(),
      dateTo: this.dateTo(),
    }),
  );

  readonly totals = computed(() => {
    const records = this.filtered();
    const income = records
      .filter((record) => record.type === 'ingreso' && record.status === 'confirmado')
      .reduce((sum, record) => sum + record.amount, 0);
    const expense = records
      .filter((record) => record.type === 'egreso' && record.status === 'confirmado')
      .reduce((sum, record) => sum + record.amount, 0);
    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      net: Math.round((income - expense) * 100) / 100,
    };
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.closed.emit();
  }

  setPeriod(event: Event): void {
    this.period.set((event.target as HTMLSelectElement).value as CashPeriod);
  }

  setPaymentMethod(event: Event): void {
    this.paymentMethod.set((event.target as HTMLSelectElement).value as 'all' | CashPaymentMethod);
  }

  setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  setDateFrom(event: Event): void {
    this.dateFrom.set((event.target as HTMLInputElement).value);
  }

  setDateTo(event: Event): void {
    this.dateTo.set((event.target as HTMLInputElement).value);
  }

  setType(type: 'all' | CashMovementType): void {
    this.type.set(type);
  }

  setStatus(status: 'all' | CashMovementStatus): void {
    this.status.set(status);
  }

  download(format: 'excel' | 'pdf'): void {
    this.exportReport.emit({ format, records: this.filtered(), filters: this.filters() });
  }

  private filters(): CashFilters {
    return {
      period: this.period(),
      type: this.type(),
      status: this.status(),
      category: 'all',
      paymentMethod: this.paymentMethod(),
      search: this.search(),
      dateFrom: this.dateFrom(),
      dateTo: this.dateTo(),
    };
  }
}
