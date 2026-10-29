import { formatMoney } from '../../../../../core/config/currency.config';
import { cashCategoryLabel, CASH_MOVEMENT_SOURCES } from '../../constants/finance.constants';
import type {
  CashLedgerEntry,
  CashMovement,
  CashMovementFilters,
  CashReport,
} from '../../models/finance.model';
import {
  buildCashLedger,
  filterCashMovements,
  summarizeCashMovements,
  toCashDate,
} from './cash-movements.adapter';

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function sortAsc(entries: readonly CashLedgerEntry[]): CashLedgerEntry[] {
  return entries
    .slice()
    .sort((a, b) =>
      `${a.movement.date}${a.movement.createdAt}`.localeCompare(
        `${b.movement.date}${b.movement.createdAt}`,
      ),
    );
}

/** Construye el reporte filtrado que consumen el resumen y las exportaciones. */
export function buildCashReport(
  movements: readonly CashMovement[],
  filters: CashMovementFilters,
  now: Date = new Date(),
): CashReport {
  const filtered = filterCashMovements(movements, filters, now);
  const ids = new Set(filtered.map((movement) => movement.id));
  const entries =
    filters.status === 'completados'
      ? buildCashLedger(movements).filter((entry) => ids.has(entry.movement.id))
      : sortAsc(filtered.map((movement) => ({ movement, balance: 0 })));
  const totals = summarizeCashMovements(filtered);

  return {
    filters,
    entries,
    count: filtered.length,
    income: totals.income,
    expense: totals.expense,
    balance: round(totals.income - totals.expense),
  };
}

function movementTypeLabel(movement: CashMovement): string {
  return movement.type === 'ingreso' ? 'Ingreso' : 'Egreso';
}

function sourceLabel(source: CashMovement['source']): string {
  return CASH_MOVEMENT_SOURCES.find((item) => item.value === source)?.label ?? 'Manual';
}

function methodLabel(value: string): string {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV compatible con Excel (`;` + BOM) para el reporte de caja. */
export function cashReportCsv(report: CashReport): string {
  const header = [
    'Fecha',
    'Tipo',
    'Categoría',
    'Concepto',
    'Referencia',
    'Origen',
    'Método de pago',
    'Estado',
    'Entrada (NIO)',
    'Salida (NIO)',
    'Saldo (NIO)',
    'Observaciones',
  ];
  const rows = report.entries.map((entry) => {
    const movement = entry.movement;
    return [
      movement.date,
      movementTypeLabel(movement),
      cashCategoryLabel(movement.category),
      movement.concept,
      movement.reference,
      sourceLabel(movement.source),
      methodLabel(movement.paymentMethod),
      movement.status === 'anulado' ? 'Anulado' : 'Completado',
      movement.type === 'ingreso' ? movement.amount.toFixed(2) : '',
      movement.type === 'egreso' ? movement.amount.toFixed(2) : '',
      entry.balance.toFixed(2),
      movement.observations,
    ];
  });

  const totals = [
    '',
    '',
    '',
    'TOTALES',
    '',
    '',
    '',
    '',
    report.income.toFixed(2),
    report.expense.toFixed(2),
    report.balance.toFixed(2),
    '',
  ];
  const lines = [header, ...rows, totals].map((row) => row.map(csvCell).join(';'));
  return `\uFEFF${lines.join('\r\n')}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function periodDescription(filters: CashMovementFilters): string {
  if (filters.period === 'hoy') return 'Hoy';
  if (filters.period === 'semana') return 'Esta semana';
  if (filters.period === 'año') return 'Este año';
  if (filters.period === 'mes') return 'Este mes';
  const from = toCashDate(filters.customFrom);
  const to = toCashDate(filters.customTo);
  if (from && to) return `Del ${from} al ${to}`;
  if (from) return `Desde ${from}`;
  if (to) return `Hasta ${to}`;
  return 'Personalizado';
}

function filterDescription(filters: CashMovementFilters): string {
  const parts = [periodDescription(filters)];
  parts.push(filters.status === 'anulados' ? 'Anulados' : 'Completados');
  parts.push(
    filters.flow === 'ingresos'
      ? 'Solo ingresos'
      : filters.flow === 'egresos'
        ? 'Solo egresos'
        : 'Todos los flujos',
  );
  parts.push(
    filters.origin === 'ligados'
      ? 'Ligados a ventas, compras y gastos'
      : filters.origin === 'manuales'
        ? 'Manuales de caja'
        : 'Todos los orígenes',
  );
  if (filters.paymentMethod !== 'todas') parts.push(methodLabel(filters.paymentMethod));
  if (filters.category !== 'todas') parts.push(cashCategoryLabel(filters.category));
  return parts.join(' · ');
}

/** Documento HTML autocontenido que se imprime como PDF. */
export function buildCashReportHtml(report: CashReport, companyName: string): string {
  const rows = report.entries
    .map((entry) => {
      const movement = entry.movement;
      return `<tr>
        <td>${escapeHtml(movement.date)}</td>
        <td>${escapeHtml(movementTypeLabel(movement))}</td>
        <td>${escapeHtml(cashCategoryLabel(movement.category))}</td>
        <td><strong>${escapeHtml(movement.concept)}</strong>${
          movement.reference
            ? `<br><span class="muted">Ref. ${escapeHtml(movement.reference)}</span>`
            : ''
        }</td>
        <td>${escapeHtml(methodLabel(movement.paymentMethod))}</td>
        <td class="right income">${movement.type === 'ingreso' ? escapeHtml(formatMoney(movement.amount)) : '—'}</td>
        <td class="right expense">${movement.type === 'egreso' ? escapeHtml(formatMoney(movement.amount)) : '—'}</td>
        <td class="right">${escapeHtml(formatMoney(entry.balance))}</td>
        <td>${escapeHtml(movement.status === 'anulado' ? 'Anulado' : 'Completado')}</td>
      </tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Reporte de caja</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0055ff; padding-bottom: 12px; }
  h1 { font-size: 22px; margin: 0; letter-spacing: -0.02em; }
  .muted { color: #64748b; font-size: 11px; }
  .filters { margin: 16px 0; font-size: 11px; color: #475569; }
  .summary { display: flex; gap: 24px; background: #f1f5f9; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; font-size: 12px; }
  .summary strong { display: block; font-size: 16px; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { text-align: left; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; border-bottom: 1px solid #cbd5e1; padding: 6px; }
  td { border-bottom: 1px solid #e2e8f0; padding: 6px; vertical-align: top; }
  .right { text-align: right; }
  .income { color: #047857; font-weight: 700; }
  .expense { color: #b91c1c; font-weight: 700; }
  tfoot td { font-weight: 700; border-top: 2px solid #0f172a; border-bottom: none; }
  @page { size: A4 landscape; margin: 12mm; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <header>
    <div>
      <h1>Reporte de caja</h1>
      <p class="muted">${escapeHtml(companyName)} · ${escapeHtml(new Date().toLocaleString('es-NI'))}</p>
    </div>
    <div class="muted">${report.count} movimientos</div>
  </header>
  <p class="filters">${escapeHtml(filterDescription(report.filters))}</p>
  <section class="summary">
    <div>Movimientos<strong>${report.count}</strong></div>
    <div>Ingresos<strong>${escapeHtml(formatMoney(report.income))}</strong></div>
    <div>Egresos<strong>${escapeHtml(formatMoney(report.expense))}</strong></div>
    <div>Balance del periodo<strong>${escapeHtml(formatMoney(report.balance))}</strong></div>
  </section>
  <table>
    <thead>
      <tr>
        <th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Concepto</th><th>Método</th>
        <th class="right">Entrada</th><th class="right">Salida</th><th class="right">Saldo</th><th>Estado</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="9">Sin movimientos para los filtros seleccionados.</td></tr>'}</tbody>
    <tfoot>
      <tr>
        <td colspan="5">Totales</td>
        <td class="right income">${escapeHtml(formatMoney(report.income))}</td>
        <td class="right expense">${escapeHtml(formatMoney(report.expense))}</td>
        <td class="right">${escapeHtml(formatMoney(report.balance))}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
}
