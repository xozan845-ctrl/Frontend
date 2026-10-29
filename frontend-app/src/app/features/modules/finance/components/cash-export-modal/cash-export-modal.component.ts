import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FocusTrapDirective } from '../../../../../shared/directives/focus-trap.directive';
import { CashMoneyPipe } from '../../../../../shared/pipes/cash-money.pipe';
import {
  CASH_FLOWS,
  CASH_MOVEMENT_CATEGORIES,
  CASH_ORIGINS,
  CASH_PERIODS,
  CASH_STATUS_FILTERS,
  buildCashReport,
  buildCashReportHtml,
  cashReportCsv,
  type CashFlowFilter,
  type CashMovement,
  type CashMovementCategory,
  type CashMovementFilters,
  type CashOriginFilter,
  type CashPaymentMethod,
  type CashPeriod,
  type CashStatusFilter,
} from '../../../../domains/finance/public-api';

/** Reporte de caja con filtros y exportación a Excel (CSV) o PDF. */
@Component({
  selector: 'app-cash-export-modal',
  standalone: true,
  imports: [FocusTrapDirective, CashMoneyPipe],
  templateUrl: './cash-export-modal.component.html',
})
export class CashExportModalComponent {
  readonly open = input.required<boolean>();
  readonly movements = input.required<readonly CashMovement[]>();
  readonly methods = input<readonly CashPaymentMethod[]>([]);
  readonly companyName = input('Mi empresa');

  readonly dismiss = output<void>();

  readonly periods = CASH_PERIODS;
  readonly statuses = CASH_STATUS_FILTERS;
  readonly flows = CASH_FLOWS;
  readonly origins = CASH_ORIGINS;
  readonly categories = CASH_MOVEMENT_CATEGORIES;

  readonly period = signal<CashPeriod>('mes');
  readonly status = signal<CashStatusFilter>('completados');
  readonly flow = signal<CashFlowFilter>('todos');
  readonly origin = signal<CashOriginFilter>('todos');
  readonly paymentMethod = signal('todas');
  readonly category = signal<CashMovementCategory | 'todas'>('todas');
  readonly customFrom = signal('');
  readonly customTo = signal('');
  readonly customPeriod = computed(() => this.period() === 'personalizado');

  readonly filters = computed<CashMovementFilters>(() => ({
    period: this.period(),
    search: '',
    flow: this.flow(),
    origin: this.origin(),
    status: this.status(),
    paymentMethod: this.paymentMethod(),
    category: this.category(),
    customFrom: this.customFrom(),
    customTo: this.customTo(),
    page: 1,
  }));

  readonly report = computed(() => buildCashReport(this.movements(), this.filters()));

  private readonly resetOnOpen = effect(() => {
    if (!this.open()) return;
    this.period.set('mes');
    this.status.set('completados');
    this.flow.set('todos');
    this.origin.set('todos');
    this.paymentMethod.set('todas');
    this.category.set('todas');
    this.customFrom.set('');
    this.customTo.set('');
  });

  setPeriod(period: CashPeriod): void {
    this.period.set(period);
  }

  setCustomFrom(value: string): void {
    this.customFrom.set(value);
    this.period.set('personalizado');
  }

  setCustomTo(value: string): void {
    this.customTo.set(value);
    this.period.set('personalizado');
  }

  exportExcel(): void {
    const report = this.report();
    if (report.count === 0) return;
    const blob = new Blob([cashReportCsv(report)], { type: 'text/csv;charset=utf-8' });
    this.download(blob, `reporte-caja-${this.period()}.csv`);
  }

  exportPdf(): void {
    const report = this.report();
    if (report.count === 0) return;
    const html = buildCashReportHtml(report, this.companyName());
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.download(
        new Blob([html], { type: 'text/html;charset=utf-8' }),
        `reporte-caja-${this.period()}.html`,
      );
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
