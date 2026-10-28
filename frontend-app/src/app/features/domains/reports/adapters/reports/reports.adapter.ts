import type {
  ReportDay,
  ReportEntry,
  ReportSnapshot,
  ReportStatus,
} from '../../models/report.model';

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function dayKey(date: string): string {
  return date ? date.slice(0, 10) : '';
}

/** Agrupa ventas por día y estado, y calcula total y ticket promedio. */
export function buildReportSnapshot(entries: readonly ReportEntry[]): ReportSnapshot {
  let totalSales = 0;
  const days = new Map<string, ReportDay>();
  const statuses = new Map<string, ReportStatus>();

  for (const entry of entries) {
    totalSales += entry.total;

    const key = dayKey(entry.date);
    if (key) {
      const day = days.get(key) ?? { date: key, total: 0, count: 0 };
      day.total += entry.total;
      day.count += 1;
      days.set(key, day);
    }

    const status = entry.status || 'sin_estado';
    const group = statuses.get(status) ?? { status, total: 0, count: 0 };
    group.total += entry.total;
    group.count += 1;
    statuses.set(status, group);
  }

  const ordersCount = entries.length;
  return {
    totalSales: round(totalSales),
    ordersCount,
    averageTicket: ordersCount === 0 ? 0 : round(totalSales / ordersCount),
    days: [...days.values()]
      .map((day) => ({ ...day, total: round(day.total) }))
      .sort((a, b) => b.date.localeCompare(a.date)),
    statuses: [...statuses.values()]
      .map((status) => ({ ...status, total: round(status.total) }))
      .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status)),
  };
}
