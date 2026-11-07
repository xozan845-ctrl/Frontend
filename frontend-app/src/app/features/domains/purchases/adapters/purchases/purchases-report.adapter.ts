import {
  DEFAULT_PURCHASE_DOCUMENT_SETTINGS,
  PURCHASE_PAYMENT_LABELS,
  PURCHASE_PERIODS,
  PURCHASE_STATUS_LABELS,
} from '../../constants/purchases.constants';
import type {
  PurchaseDocumentSettings,
  PurchasePeriod,
  PurchaseRecord,
  PurchaseReport,
  PurchaseReportOptions,
} from '../../models/purchase.model';
import { filterPurchaseRecords, normalizePurchaseText, round2 } from './purchases.adapter';

/** Resumen y filas del reporte de compras. */
export function buildPurchaseReport(
  records: readonly PurchaseRecord[],
  options: PurchaseReportOptions,
  now: Date = new Date(),
): PurchaseReport {
  const rows = filterPurchaseRecords(records, {
    period: options.period,
    customFrom: options.customFrom,
    customTo: options.customTo,
    status: options.status,
    type: options.type,
    payment: options.payment,
    supplierIds: options.supplierIds,
    now,
  });
  const productTotals = new Map<string, { name: string; quantity: number; total: number }>();
  let units = 0;
  let total = 0;
  for (const record of rows) {
    total += record.total;
    for (const line of record.lines) {
      units += line.quantity;
      if (record.origin !== 'productos') continue;
      const key = normalizePurchaseText(line.name);
      const current = productTotals.get(key) ?? { name: line.name, quantity: 0, total: 0 };
      current.quantity = round2(current.quantity + line.quantity);
      current.total = round2(current.total + line.quantity * line.unitCost);
      productTotals.set(key, current);
    }
  }
  return {
    rows,
    count: rows.length,
    total: round2(total),
    units: round2(units),
    productLines: [...productTotals.values()].sort((a, b) => a.name.localeCompare(b.name, 'es')),
  };
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** CSV del reporte (compatible con Excel, separador `;`). */
export function purchaseReportCsv(report: PurchaseReport, includeProducts: boolean): string {
  const lines: string[] = [
    [
      'N° compra',
      'Fecha',
      'Proveedor',
      'Tipo',
      'Productos',
      'Unidades',
      'Total',
      'Pago',
      'Estado',
    ].join(';'),
  ];
  for (const record of report.rows) {
    lines.push(
      [
        record.number,
        record.date,
        record.supplierName,
        record.origin === 'directa' ? 'Directa' : 'Productos',
        record.lines.map((line) => line.name).join(' / '),
        record.lines.reduce((sum, line) => sum + line.quantity, 0),
        record.total.toFixed(2),
        PURCHASE_PAYMENT_LABELS[record.paymentMethod],
        PURCHASE_STATUS_LABELS[record.status],
      ]
        .map(csvCell)
        .join(';'),
    );
  }
  lines.push(['', '', '', '', '', '', report.total.toFixed(2), '', ''].map(csvCell).join(';'));
  if (includeProducts && report.productLines.length > 0) {
    lines.push('');
    lines.push(['Producto', 'Cantidad', 'Total'].join(';'));
    for (const row of report.productLines) {
      lines.push([row.name, row.quantity, row.total.toFixed(2)].map(csvCell).join(';'));
    }
  }
  return `\uFEFF${lines.join('\n')}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function periodLabel(period: PurchasePeriod): string {
  return PURCHASE_PERIODS.find((item) => item.value === period)?.label ?? 'Personalizado';
}

/** Documento HTML imprimible del reporte de compras. */
export function buildPurchaseReportHtml(
  report: PurchaseReport,
  settings: PurchaseDocumentSettings,
  companyName: string,
  options: PurchaseReportOptions,
): string {
  const headerColor = /^#[0-9a-fA-F]{6}$/.test(settings.headerColor)
    ? settings.headerColor
    : DEFAULT_PURCHASE_DOCUMENT_SETTINGS.headerColor;
  const rows = report.rows
    .map(
      (record) => `<tr>
        <td>${escapeHtml(record.number)}</td>
        <td>${escapeHtml(record.date)}</td>
        <td>${escapeHtml(record.supplierName)}</td>
        <td>${escapeHtml(record.lines.map((line) => line.name).join(' / '))}</td>
        <td class="right">${record.total.toFixed(2)}</td>
      </tr>`,
    )
    .join('');
  const details = [
    settings.showRuc ? 'RUC: —' : '',
    settings.showAddress ? 'Dirección: —' : '',
    settings.showPhone ? 'Teléfono: —' : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Reporte de compras — ${escapeHtml(companyName)}</title>
<style>
  @page { margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 0; }
  header { background: ${headerColor}; color: #fff; padding: 22px 26px; border-radius: 12px; }
  header h1 { margin: 0; font-size: 22px; }
  header p { margin: 4px 0 0; opacity: .9; font-size: 12px; }
  .meta { margin: 14px 0 8px; font-size: 11px; color: #4b5563; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
  th { background: ${settings.matchTableColor ? headerColor : '#f3f4f6'}; color: ${settings.matchTableColor ? '#fff' : '#111827'}; text-align: left; padding: 8px; }
  td { padding: 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  .right { text-align: right; white-space: nowrap; }
  .summary { margin-top: 14px; padding: 12px 14px; background: #f3f4f6; border-radius: 10px; font-size: 12px; }
  footer { margin-top: 22px; font-size: 11px; color: #6b7280; }
</style>
</head>
<body>
  <header>
    <h1>${escapeHtml(companyName)}</h1>
    <p>Reporte de compras</p>
  </header>
  <p class="meta">Periodo: ${escapeHtml(periodLabel(options.period))} · ${report.count} compras · Generado ${escapeHtml(new Date().toLocaleDateString('es-NI'))}</p>
  ${details ? `<p class="meta">${escapeHtml(details)}</p>` : ''}
  <table>
    <thead><tr><th>N° compra</th><th>Fecha</th><th>Proveedor</th><th>Productos</th><th class="right">Total</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5">Sin compras en el periodo.</td></tr>'}</tbody>
  </table>
  <div class="summary">Compras: <strong>${report.count}</strong> · Unidades: <strong>${report.units}</strong> · Total: <strong>NIO ${report.total.toFixed(2)}</strong></div>
  ${settings.footerMessage ? `<footer>${escapeHtml(settings.footerMessage)}</footer>` : ''}
</body>
</html>`;
}
