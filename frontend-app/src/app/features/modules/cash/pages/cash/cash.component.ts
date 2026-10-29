import { Component, inject, signal } from '@angular/core';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import {
  CASH_CATEGORIES,
  CASH_PAGE_SIZE,
  CASH_PAYMENT_METHODS,
  CASH_PERIODS,
  CASH_TABS,
  CashStore,
  PETTY_CASH_FUND,
  type CashCategoryFilter,
  type CashMovement,
  type CashMovementStatus,
  type CashMovementType,
  type CashPaymentMethod,
  type CashPeriod,
  type CashReportExport,
  type CashTab,
  type CreateCashMovementPayload,
} from '../../../../domains/cash/public-api';
import { CashMovementModalComponent } from '../../components/cash-movement-modal/cash-movement-modal.component';
import { CashReportModalComponent } from '../../components/cash-report-modal/cash-report-modal.component';

/** Pantalla de caja de empresa (ADR-73): KPIs, tabs, movimientos y reportes. */
@Component({
  selector: 'app-cash',
  standalone: true,
  imports: [AppCurrencyPipe, AppDatePipe, CashMovementModalComponent, CashReportModalComponent],
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
  readonly categories = CASH_CATEGORIES;
  readonly paymentMethods = CASH_PAYMENT_METHODS;
  readonly tabs = CASH_TABS;
  readonly tabTitles: Record<CashTab, string> = {
    movements: 'Movimientos de caja',
    'payment-methods': 'Métodos de pago',
    closures: 'Cierres diarios',
    'petty-cash': 'Caja chica',
    banks: 'Bancos',
    transfers: 'Transferencias',
  };
  readonly tabSubtitles: Record<CashTab, string> = {
    movements: 'Entradas y salidas en efectivo y bancos.',
    'payment-methods': 'Totales agrupados por forma de pago.',
    closures: 'Resumen de operaciones agrupado por día.',
    'petty-cash': 'Fondo y gastos menores del día a día.',
    banks: 'Saldo y movimientos por cuenta bancaria.',
    transfers: 'Movimientos registrados como transferencia.',
  };

  private readonly seoService = injectSeoPage(
    'Caja — Empresa',
    'Controla el efectivo, los bancos, los cierres diarios y la caja chica de tu negocio.',
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

  setPeriod(event: Event): void {
    this.store.setPeriod((event.target as HTMLSelectElement).value as CashPeriod);
  }

  setType(event: Event): void {
    this.store.setType((event.target as HTMLSelectElement).value as 'all' | CashMovementType);
  }

  setStatus(event: Event): void {
    this.store.setStatus((event.target as HTMLSelectElement).value as 'all' | CashMovementStatus);
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

  search(event: Event): void {
    this.store.setSearch((event.target as HTMLInputElement).value);
  }

  selectCategory(event: Event): void {
    this.store.setCategory((event.target as HTMLSelectElement).value as CashCategoryFilter);
  }

  selectPaymentMethod(event: Event): void {
    this.store.setPaymentMethod(
      (event.target as HTMLSelectElement).value as 'all' | CashPaymentMethod,
    );
  }

  resetFilters(): void {
    this.store.resetFilters();
  }

  showsMovements(tab: CashTab): boolean {
    return tab === 'movements' || tab === 'petty-cash' || tab === 'transfers' || tab === 'banks';
  }

  statusClass(status: CashMovementStatus): string {
    if (status === 'confirmado') return 'badge-success';
    if (status === 'pendiente') return 'badge-warning';
    return 'badge-danger';
  }

  private downloadCsv(records: readonly CashMovement[]): void {
    const header = [
      'Fecha',
      'Tipo',
      'Concepto',
      'Categoría',
      'Método de pago',
      'Cuenta',
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
    subtitle.textContent = `${records.length} movimientos · Entradas: C$${income.toFixed(2)} · Salidas: C$${expense.toFixed(2)}`;
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
        record.type === 'ingreso' ? `C$${record.amount.toFixed(2)}` : '—',
        record.type === 'egreso' ? `C$${record.amount.toFixed(2)}` : '—',
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
