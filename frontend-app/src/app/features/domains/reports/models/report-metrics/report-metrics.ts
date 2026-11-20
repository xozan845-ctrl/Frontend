import type {
  ReportDay,
  ReportEntry,
  ReportEntryState,
  ReportSnapshot,
  ReportStatus,
} from '../report.model';

/** Política comercial: solo un pago o una entrega confirmados son venta. */
const RECOGNIZED_STATES: ReadonlySet<ReportEntryState> = new Set(['paid', 'delivered']);

/** Política comercial: solo el pago confirmado cuenta como cobro. */
const COLLECTED_STATES: ReadonlySet<ReportEntryState> = new Set(['paid']);

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function dayKey(date: string): string {
  return date ? date.slice(0, 10) : '';
}

/**
 * Calcula el snapshot de reportes sobre entradas ya normalizadas (R-CX-1,
 * R-CX-4). Separa pedidos creados, ventas reconocidas, cobros, cancelaciones,
 * devoluciones y neto; un estado desconocido nunca cuenta como venta.
 */
export function buildReportSnapshot(entries: readonly ReportEntry[]): ReportSnapshot {
  let recognizedSales = 0;
  let recognizedOrders = 0;
  let collections = 0;
  let cancellations = 0;
  let cancelledOrders = 0;
  let returns = 0;
  let returnedOrders = 0;
  const days = new Map<string, ReportDay>();
  const statuses = new Map<ReportEntryState, ReportStatus>();

  for (const entry of entries) {
    const status = entry.status;
    const amount = Number.isFinite(entry.total) ? entry.total : 0;

    if (RECOGNIZED_STATES.has(status)) {
      recognizedSales += amount;
      recognizedOrders += 1;

      const key = dayKey(entry.date);
      if (key) {
        const day = days.get(key) ?? { date: key, total: 0, count: 0 };
        day.total += amount;
        day.count += 1;
        days.set(key, day);
      }
    }

    if (COLLECTED_STATES.has(status)) {
      collections += amount;
    }

    if (status === 'cancelled') {
      cancellations += amount;
      cancelledOrders += 1;
    }

    if (status === 'returned') {
      returns += amount;
      returnedOrders += 1;
    }

    const group = statuses.get(status) ?? { status, total: 0, count: 0 };
    group.total += amount;
    group.count += 1;
    statuses.set(status, group);
  }

  return {
    ordersCount: entries.length,
    recognizedSales: round(recognizedSales),
    recognizedOrders,
    collections: round(collections),
    cancellations: round(cancellations),
    cancelledOrders,
    returns: round(returns),
    returnedOrders,
    netSales: round(recognizedSales - returns),
    averageTicket: recognizedOrders === 0 ? 0 : round(recognizedSales / recognizedOrders),
    days: [...days.values()]
      .map((day) => ({ ...day, total: round(day.total) }))
      .sort((a, b) => b.date.localeCompare(a.date)),
    statuses: [...statuses.values()]
      .map((status) => ({ ...status, total: round(status.total) }))
      .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status)),
  };
}
