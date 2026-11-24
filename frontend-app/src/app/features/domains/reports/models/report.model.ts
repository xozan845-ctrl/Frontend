/** Estados normalizados de una entrada de reporte (vocabulario del dominio). */
export const REPORT_ENTRY_STATES = [
  'pending',
  'paid',
  'delivered',
  'cancelled',
  'returned',
  'unknown',
] as const;

export type ReportEntryState = (typeof REPORT_ENTRY_STATES)[number];

/** Traducción de los estados propios de cada API al vocabulario del reporte. */
export type ReportStateAliases = Readonly<Record<string, ReportEntryState>>;

export interface ReportEntry {
  /** ISO 8601 o fecha corta; solo se usa la parte de día. */
  date: string;
  total: number;
  /** Estado normalizado por la fuente; nunca el vocabulario crudo del backend. */
  status: ReportEntryState;
}

export interface ReportDay {
  date: string;
  /** Ventas reconocidas del día. */
  total: number;
  /** Pedidos con venta reconocida del día. */
  count: number;
}

export interface ReportStatus {
  status: ReportEntryState;
  total: number;
  count: number;
}

export interface ReportSnapshot {
  /** Pedidos creados recibidos, en cualquier estado (incluye desconocidos). */
  ordersCount: number;
  /** Importe de ventas reconocidas: pagadas o entregadas. */
  recognizedSales: number;
  /** Pedidos con venta reconocida. */
  recognizedOrders: number;
  /** Importe de cobros confirmados: pagados. */
  collections: number;
  /** Importe de pedidos cancelados. */
  cancellations: number;
  cancelledOrders: number;
  /** Importe de pedidos devueltos. */
  returns: number;
  returnedOrders: number;
  /** Ventas reconocidas netas de devoluciones (puede ser negativo). */
  netSales: number;
  /** Ticket promedio de las ventas reconocidas. */
  averageTicket: number;
  /** Agrupación de ventas reconocidas por día. */
  days: ReportDay[];
  /** Todos los estados normalizados, incluidas cancelaciones y devoluciones. */
  statuses: ReportStatus[];
}
