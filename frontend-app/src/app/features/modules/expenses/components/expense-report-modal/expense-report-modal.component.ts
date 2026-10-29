import { Component, HostListener, computed, input, output, signal } from '@angular/core';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_PERIODS,
  EXPENSE_STATUS_FILTERS,
  filterExpenses,
  type ExpenseFilters,
  type ExpensePaymentMethod,
  type ExpensePeriod,
  type ExpenseRecord,
  type ExpenseReportExport,
  type ExpenseStatusFilter,
  type ExpenseType,
} from '../../../../domains/expenses/public-api';

/** Modal de reporte de gastos; filtra y delega la descarga al contenedor. */
@Component({
  selector: 'app-expense-report-modal',
  standalone: true,
  imports: [AppCurrencyPipe],
  templateUrl: './expense-report-modal.component.html',
})
export class ExpenseReportModalComponent {
  readonly open = input(false);
  readonly records = input<readonly ExpenseRecord[]>([]);
  readonly closed = output<void>();
  readonly exportReport = output<ExpenseReportExport>();

  readonly categories = EXPENSE_CATEGORIES;
  readonly paymentMethods = EXPENSE_PAYMENT_METHODS;
  readonly periods = EXPENSE_PERIODS;
  readonly statusFilters = EXPENSE_STATUS_FILTERS;
  readonly typeFilters: readonly { value: 'all' | ExpenseType; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'inmediato', label: 'Inmediatos' },
    { value: 'programado', label: 'Programados / recurrentes' },
  ];

  readonly period = signal<ExpensePeriod>('month');
  readonly status = signal<ExpenseStatusFilter>('active');
  readonly type = signal<'all' | ExpenseType>('all');
  readonly category = signal('all');
  readonly paymentMethod = signal<'all' | ExpensePaymentMethod>('all');
  readonly beneficiary = signal('');

  readonly filtered = computed(() =>
    filterExpenses(this.records(), {
      period: this.period(),
      status: this.status(),
      type: this.type(),
      category: this.category(),
      paymentMethod: this.paymentMethod(),
      beneficiary: this.beneficiary(),
      search: '',
    }),
  );

  readonly total = computed(
    () => Math.round(this.filtered().reduce((sum, record) => sum + record.amount, 0) * 100) / 100,
  );

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.closed.emit();
  }

  setPeriod(event: Event): void {
    this.period.set((event.target as HTMLSelectElement).value as ExpensePeriod);
  }

  setStatus(status: ExpenseStatusFilter): void {
    this.status.set(status);
  }

  setType(type: 'all' | ExpenseType): void {
    this.type.set(type);
  }

  setCategory(event: Event): void {
    this.category.set((event.target as HTMLSelectElement).value);
  }

  setPaymentMethod(event: Event): void {
    this.paymentMethod.set(
      (event.target as HTMLSelectElement).value as 'all' | ExpensePaymentMethod,
    );
  }

  setBeneficiary(event: Event): void {
    this.beneficiary.set((event.target as HTMLInputElement).value);
  }

  download(format: 'excel' | 'pdf'): void {
    this.exportReport.emit({ format, records: this.filtered(), filters: this.filters() });
  }

  private filters(): ExpenseFilters {
    return {
      period: this.period(),
      status: this.status(),
      type: this.type(),
      category: this.category(),
      paymentMethod: this.paymentMethod(),
      beneficiary: this.beneficiary(),
      search: '',
    };
  }
}
