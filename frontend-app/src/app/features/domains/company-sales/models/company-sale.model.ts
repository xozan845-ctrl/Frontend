/** Periodo del historial de ventas de la empresa. */
export type CompanySalePeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

/** Filtro rápido por forma de pago. */
export type CompanySalePaymentFilter = 'all' | 'cash' | 'credit' | 'pending';

/** Formas de pago admitidas por el POS de empresa. */
export type CompanySalePaymentMethod =
  'efectivo' | 'tarjeta' | 'transferencia' | 'paypal' | 'otro' | 'separado';

/** Estado local de una venta registrada desde el workspace. */
export type CompanySaleStatus = 'pagada' | 'pendiente';

/** Origen de una línea de venta. */
export type CompanySaleLineKind = 'product' | 'service';

/** Modo de cliente elegido en el asistente de Nueva Venta. */
export type CompanySaleClientMode = 'existing' | 'final' | 'quick';

/** Grupo de pago usado por los chips del historial. */
export type CompanySalePaymentGroup = 'cash' | 'credit' | 'pending';

/** Línea de producto o servicio dentro de una venta. */
export interface CompanySaleLine {
  id: string;
  kind: CompanySaleLineKind;
  /** Id del producto/servicio de origen, si existe. */
  referenceId?: string;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/** Cliente capturado en el paso 1 del asistente. */
export interface CompanySaleClientDraft {
  mode: CompanySaleClientMode;
  clientId?: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
}

/** Payload para registrar una venta local. */
export interface CreateCompanySalePayload {
  client: CompanySaleClientDraft;
  lines: readonly CompanySaleLine[];
  paymentMethod: CompanySalePaymentMethod;
  /** Fecha de la venta en ISO 8601 o `yyyy-mm-dd`. */
  date: string;
  /** Descuento global entre 0 y 100. */
  discountPercent: number;
  notes: string;
}

/**
 * Venta persistida localmente mientras Core Engine no exponga un POST de
 * ventas de empresa (ADR-53).
 */
export interface CompanySaleRecord {
  id: string;
  number: string;
  createdAt: string;
  clientId: string | null;
  clientName: string;
  phone: string;
  email: string;
  company: string;
  paymentMethod: CompanySalePaymentMethod;
  status: CompanySaleStatus;
  lines: CompanySaleLine[];
  subtotal: number;
  discount: number;
  total: number;
  profit: number;
  notes: string;
  providerName: string;
}

/** Fila normalizada del historial (orden del backend o venta local). */
export interface CompanySaleRow {
  id: string;
  number: string;
  date: string;
  clientName: string;
  paymentLabel: string;
  paymentGroup: CompanySalePaymentGroup;
  productsLabel: string;
  providerName: string;
  total: number;
  profit: number;
  status: string;
  statusLabel: string;
  source: 'order' | 'local';
}

/** KPIs del encabezado de ventas. */
export interface CompanySaleKpis {
  todaySales: number;
  monthSales: number;
  monthCount: number;
  averageTicket: number;
  estimatedProfit: number;
}

/** Cliente frecuente presentado en la sección de pago recurrente. */
export interface CompanyRecurringClient {
  id: string;
  name: string;
  frequencyLabel: string;
  lastPaymentAt: string | null;
  nextPaymentAt: string | null;
  amountDue: number;
  status: 'Activo' | 'Inactivo';
}

/** Resultado de registrar una venta local. */
export interface CompanySaleMutationResult {
  ok: boolean;
  message?: string;
  sale?: CompanySaleRecord;
}

/** Filtros del historial de ventas. */
export interface CompanySaleFilters {
  period: CompanySalePeriod;
  payment: CompanySalePaymentFilter;
  search: string;
  customFrom: string;
  customTo: string;
  now?: Date;
}
