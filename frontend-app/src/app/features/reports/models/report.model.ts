export interface ReportEntry {
  /** ISO 8601 o fecha corta; solo se usa la parte de día. */
  date: string;
  total: number;
  status: string;
}

export interface ReportDay {
  date: string;
  total: number;
  count: number;
}

export interface ReportStatus {
  status: string;
  total: number;
  count: number;
}

export interface ReportSnapshot {
  totalSales: number;
  ordersCount: number;
  averageTicket: number;
  days: ReportDay[];
  statuses: ReportStatus[];
}
