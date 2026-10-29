import { Component, inject, signal } from '@angular/core';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../../shared/pipes/app-date.pipe';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import {
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_STATUSES,
  EXPENSE_TYPES,
  EXPENSES_PAGE_SIZE,
  ExpensesStore,
  type CreateExpensePayload,
  type ExpensePaymentMethod,
  type ExpenseRecord,
  type ExpenseReportExport,
  type ExpenseStatus,
  type ExpenseType,
} from '../../../../domains/expenses/public-api';
import { ExpenseModalComponent } from '../../components/expense-modal/expense-modal.component';
import { ExpenseReportModalComponent } from '../../components/expense-report-modal/expense-report-modal.component';

/** Pantalla de gastos de empresa (ADR-72): KPIs, filtros, CRUD y reporte. */
@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [AppCurrencyPipe, AppDatePipe, ExpenseModalComponent, ExpenseReportModalComponent],
  templateUrl: './expenses.component.html',
})
export default class ExpensesComponent {
  readonly store = inject(ExpensesStore);
  readonly expenseModalOpen = signal(false);
  readonly reportOpen = signal(false);
  readonly editingExpense = signal<ExpenseRecord | null>(null);
  readonly modalError = signal<string | null>(null);
  readonly pageSize = EXPENSES_PAGE_SIZE;
  readonly quickFilters = [
    { value: 'all', label: 'Todos', type: 'all', status: 'all' },
    { value: 'inmediato', label: 'Inmediatos', type: 'inmediato', status: 'all' },
    { value: 'programado', label: 'Programados', type: 'programado', status: 'all' },
    { value: 'pagado', label: 'Pagados', type: 'all', status: 'pagado' },
  ] as const;

  readonly typeLabels = Object.fromEntries(
    EXPENSE_TYPES.map((type) => [type.value, type.label]),
  ) as Record<ExpenseType, string>;
  readonly statusLabels = Object.fromEntries(
    EXPENSE_STATUSES.map((status) => [status.value, status.label]),
  ) as Record<ExpenseStatus, string>;
  readonly paymentLabels = Object.fromEntries(
    EXPENSE_PAYMENT_METHODS.map((method) => [method.value, method.label]),
  ) as Record<ExpensePaymentMethod, string>;

  private readonly seoService = injectSeoPage(
    'Gastos — Empresa',
    'Controla los egresos de tu negocio: inmediatos, programados, recurrentes y salarios.',
  );

  openNewExpense(): void {
    this.editingExpense.set(null);
    this.modalError.set(null);
    this.expenseModalOpen.set(true);
  }

  openEditExpense(expense: ExpenseRecord): void {
    this.editingExpense.set(expense);
    this.modalError.set(null);
    this.expenseModalOpen.set(true);
  }

  closeExpenseModal(): void {
    this.expenseModalOpen.set(false);
    this.editingExpense.set(null);
    this.modalError.set(null);
  }

  saveExpense(payload: CreateExpensePayload): void {
    const current = this.editingExpense();
    const result = current
      ? this.store.updateExpense(current.id, payload)
      : this.store.addExpense(payload);
    if (!result.ok) {
      this.modalError.set(result.message ?? 'No se pudo guardar el gasto.');
      return;
    }
    this.closeExpenseModal();
  }

  search(event: Event): void {
    this.store.setSearch((event.target as HTMLInputElement).value);
  }

  selectCategory(event: Event): void {
    this.store.setCategory((event.target as HTMLSelectElement).value);
  }

  openReport(): void {
    this.reportOpen.set(true);
  }

  closeReport(): void {
    this.reportOpen.set(false);
  }

  handleExport(report: ExpenseReportExport): void {
    if (report.format === 'excel') this.downloadCsv(report.records);
    else this.openPdf(report.records);
  }

  private downloadCsv(records: readonly ExpenseRecord[]): void {
    const header = [
      'Fecha',
      'Concepto',
      'Categoría',
      'Tipo',
      'Monto',
      'Estado',
      'Beneficiario',
      'Forma de pago',
      'IVA incluido',
      'Retención IR',
      'Observaciones',
    ];
    const rows = records.map((record) => [
      record.date,
      record.concept,
      this.store.categoryLabels()[record.category] ?? record.category,
      this.typeLabels[record.type],
      record.amount.toFixed(2),
      this.statusLabels[record.status],
      record.beneficiary,
      this.paymentLabels[record.paymentMethod],
      record.includesVat ? 'Sí' : 'No',
      record.irRetention.toFixed(2),
      record.notes,
    ]);
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `reporte-gastos-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private openPdf(records: readonly ExpenseRecord[]): void {
    const win = window.open('', '_blank');
    if (!win) return;
    win.opener = null;
    const doc = win.document;
    doc.title = 'Reporte de gastos';
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
    title.textContent = 'Reporte de gastos';
    const total = records.reduce((sum, record) => sum + record.amount, 0);
    const subtitle = doc.createElement('p');
    subtitle.textContent = `${records.length} gastos · Total: C$${total.toFixed(2)}`;
    const table = doc.createElement('table');
    const headRow = doc.createElement('tr');
    for (const heading of [
      'Fecha',
      'Concepto',
      'Categoría',
      'Tipo',
      'Monto',
      'Estado',
      'Beneficiario',
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
        record.concept,
        this.store.categoryLabels()[record.category] ?? record.category,
        this.typeLabels[record.type],
        `C$${record.amount.toFixed(2)}`,
        this.statusLabels[record.status],
        record.beneficiary,
      ];
      values.forEach((value, index) => {
        const cell = doc.createElement('td');
        if (index === 4) cell.className = 'num';
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
