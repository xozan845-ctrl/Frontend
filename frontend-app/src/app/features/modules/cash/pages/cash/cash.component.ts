import { Component, inject, signal } from '@angular/core';
import { CashMoneyPipe } from '../../../../../shared/pipes/cash-money.pipe';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import {
  CASH_PAGE_SIZE,
  CASH_PERIODS,
  CASH_TABS,
  CashStore,
  PETTY_CASH_FUND,
  type CashMovement,
  type CashMovementCategory,
  type CashMovementSource,
  type CashMovementStatus,
  type CashPeriod,
  type CashReportExport,
  type CashTab,
  type CreateCashMovementPayload,
} from '../../../../domains/cash/public-api';
import { CashMovementModalComponent } from '../../components/cash-movement-modal/cash-movement-modal.component';
import { CashReportModalComponent } from '../../components/cash-report-modal/cash-report-modal.component';

/** Centro financiero de caja de empresa (ADR-73/74). */
@Component({
  selector: 'app-cash',
  standalone: true,
  imports: [CashMoneyPipe, AppDatePipe, CashMovementModalComponent, CashReportModalComponent],
  templateUrl: './cash.component.html',
})
export default class CashComponent {
  readonly store = inject(CashStore);
  readonly movementModalOpen = signal(false);
  readonly reportOpen = signal(false);
  readonly editingMovement = signal<CashMovement | null>(null);
  readonly modalError = signal<string | null>(null);
  readonly preset = signal<Partial<CreateCashMovementPayload> | null>(null);
  readonly pageSize = CASH_PAGE_SIZE;
  readonly pettyCashFund = PETTY_CASH_FUND;
  readonly periods = CASH_PERIODS;
  readonly tabs = CASH_TABS;
  readonly tabTitles: Record<CashTab, string> = {
    movements: 'Movimientos financieros',
    'payment-methods': 'Métodos de pago',
    closures: 'Cierres diarios',
    'petty-cash': 'Caja chica',
    banks: 'Bancos',
    transfers: 'Transferencias',
  };

  private readonly cashMoney = new CashMoneyPipe();

  private readonly seoService = injectSeoPage(
    'Caja / Pagos — Empresa',
    'Centro financiero del negocio. Todos los movimientos de dinero en un lugar.',
  );

  openNewMovement(preset: Partial<CreateCashMovementPayload> | null = null): void {
    this.editingMovement.set(null);
    this.preset.set(preset);
    this.modalError.set(null);
    this.movementModalOpen.set(true);
  }

  openEditMovement(movement: CashMovement): void {
    this.editingMovement.set(movement);
    this.preset.set(null);
    this.modalError.set(null);
    this.movementModalOpen.set(true);
  }

  closeMovementModal(): void {
    this.movementModalOpen.set(false);
    this.editingMovement.set(null);
    this.preset.set(null);
    this.modalError.set(null);
  }

  saveMovement(payload: CreateCashMovementPayload): void {
    const current = this.editingMovement();
    const result = current
      ? this.store.updateMovement(current.id, payload)
      : this.store.addMovement(payload);
    if (!result.ok) {
      this.modalError.set(result.message ?? 'No se pudo guardar el movimiento.');
      return;
    }
    this.closeMovementModal();
  }

  selectPeriod(period: CashPeriod): void {
    this.store.setPeriod(period);
  }

  setDateFrom(event: Event): void {
    this.store.setDateRange((event.target as HTMLInputElement).value, this.store.dateTo());
  }

  setDateTo(event: Event): void {
    this.store.setDateRange(this.store.dateFrom(), (event.target as HTMLInputElement).value);
  }

  search(event: Event): void {
    this.store.setSearch((event.target as HTMLInputElement).value);
  }

  resetFilters(): void {
    this.store.resetFilters();
  }

  openReport(): void {
    this.reportOpen.set(true);
  }

  closeReport(): void {
    this.reportOpen.set(false);
  }

  handleExport(report: CashReportExport): void {
    if (report.format === 'excel') this.downloadCsv(report.records);
    else this.openPdf(report.records);
    this.closeReport();
  }

  tabClass(tab: CashTab): string {
    const base =
      'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors';
    return this.store.tab() === tab
      ? `${base} bg-emerald-300 text-emerald-950 shadow-sm`
      : `${base} text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-surface-800 dark:hover:text-white`;
  }

  periodClass(period: CashPeriod): string {
    const base =
      'inline-flex items-center rounded-xl px-3 py-2 text-xs font-bold transition-colors';
    return this.store.period() === period
      ? `${base} bg-emerald-300 text-emerald-950 shadow-sm`
      : `${base} text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-surface-800 dark:hover:text-white`;
  }

  categoryBadge(category: CashMovementCategory): string {
    if (
      category === 'venta' ||
      category === 'cobro' ||
      category === 'aporte' ||
      category === 'deposito'
    ) {
      return 'badge badge-success normal-case';
    }
    if (category === 'gasto' || category === 'pago-proveedor' || category === 'retiro') {
      return 'badge badge-danger normal-case';
    }
    if (category === 'transferencia') return 'badge badge-primary normal-case';
    if (category === 'caja-chica') return 'badge badge-warning normal-case';
    return 'badge badge-neutral normal-case';
  }

  balanceClass(balance: number): string {
    return balance < 0
      ? 'text-red-600 dark:text-red-400'
      : 'text-emerald-600 dark:text-emerald-400';
  }

  statusClass(status: CashMovementStatus): string {
    if (status === 'confirmado') return 'badge-success';
    if (status === 'pendiente') return 'badge-warning';
    return 'badge-danger';
  }

  sourceLabel(source: CashMovementSource): string {
    return this.store.sourceLabels()[source] ?? source;
  }

  private downloadCsv(records: readonly CashMovement[]): void {
    const header = [
      'Fecha',
      'Tipo',
      'Concepto',
      'Categoría',
      'Método de pago',
      'Cuenta',
      'Origen',
      'Referencia',
      'Cliente / proveedor',
      'Entrada',
      'Salida',
      'Estado',
      'Observaciones',
    ];
    const rows = records.map((record) => [
      record.date,
      this.store.typeLabels()[record.type] ?? record.type,
      record.concept,
      this.store.categoryLabels()[record.category] ?? record.category,
      this.store.paymentLabels()[record.paymentMethod] ?? record.paymentMethod,
      this.store.accountLabels()[record.account] ?? record.account,
      this.sourceLabel(record.source),
      record.reference,
      record.counterpart,
      record.type === 'ingreso' ? record.amount.toFixed(2) : '',
      record.type === 'egreso' ? record.amount.toFixed(2) : '',
      this.store.statusLabels()[record.status] ?? record.status,
      record.notes,
    ]);
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `reporte-caja-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private openPdf(records: readonly CashMovement[]): void {
    const win = window.open('', '_blank');
    if (!win) return;
    win.opener = null;
    const doc = win.document;
    doc.title = 'Reporte de caja';
    const style = doc.createElement('style');
    style.textContent = `
      body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; }
      h1 { font-size: 22px; margin: 0 0 4px; }
      p { color: #475569; margin: 0 0 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th, td { border-bottom: 1px solid #e2e8f0; padding: 7px 6px; text-align: left; }
      th { text-transform: uppercase; letter-spacing: .08em; color: #64748b; }
      td.num { text-align: right; white-space: nowrap; }
    `;
    doc.head.append(style);

    const title = doc.createElement('h1');
    title.textContent = 'Reporte de caja';
    const income = records
      .filter((record) => record.type === 'ingreso' && record.status === 'confirmado')
      .reduce((sum, record) => sum + record.amount, 0);
    const expense = records
      .filter((record) => record.type === 'egreso' && record.status === 'confirmado')
      .reduce((sum, record) => sum + record.amount, 0);
    const subtitle = doc.createElement('p');
    subtitle.textContent = `${records.length} movimientos · Entradas: ${this.cashMoney.transform(income)} · Salidas: ${this.cashMoney.transform(expense)}`;
    const table = doc.createElement('table');
    const headRow = doc.createElement('tr');
    for (const heading of [
      'Fecha',
      'Tipo',
      'Concepto',
      'Categoría',
      'Método',
      'Cuenta',
      'Entrada',
      'Salida',
      'Estado',
    ]) {
      const th = doc.createElement('th');
      th.textContent = heading;
      headRow.append(th);
    }
    const thead = doc.createElement('thead');
    thead.append(headRow);
    const tbody = doc.createElement('tbody');
    for (const record of records) {
      const row = doc.createElement('tr');
      const values = [
        record.date,
        this.store.typeLabels()[record.type] ?? record.type,
        record.concept,
        this.store.categoryLabels()[record.category] ?? record.category,
        this.store.paymentLabels()[record.paymentMethod] ?? record.paymentMethod,
        this.store.accountLabels()[record.account] ?? record.account,
        record.type === 'ingreso' ? this.cashMoney.transform(record.amount) : '—',
        record.type === 'egreso' ? this.cashMoney.transform(record.amount) : '—',
        this.store.statusLabels()[record.status] ?? record.status,
      ];
      values.forEach((value, index) => {
        const cell = doc.createElement('td');
        if (index === 6 || index === 7) cell.className = 'num';
        cell.textContent = value;
        row.append(cell);
      });
      tbody.append(row);
    }
    table.append(thead, tbody);
    doc.body.append(title, subtitle, table);
    win.focus();
    win.print();
  }
}
