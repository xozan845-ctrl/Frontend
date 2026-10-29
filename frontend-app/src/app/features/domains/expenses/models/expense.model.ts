export type ExpenseType = 'inmediato' | 'programado' | 'recurrente';
export type ExpenseStatus = 'pendiente' | 'pagado' | 'cancelado';
export type ExpensePaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'credito';
export type ExpensePeriod = 'month' | 'previous' | 'year' | 'all';
export type ExpenseStatusFilter = 'active' | 'cancelled' | 'all';

export interface ExpenseRecord {
  id: string;
  /** Fecha local del gasto en `yyyy-mm-dd`. */
  date: string;
  concept: string;
  /** Categoría visible; puede ser personalizada. */
  category: string;
  type: ExpenseType;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  status: ExpenseStatus;
  includesVat: boolean;
  /** Retención de IR aplicada, 0 si no aplica. */
  irRetention: number;
  /** Proveedor, empleado o beneficiario. */
  beneficiary: string;
  notes: string;
  /** Fecha programada para gastos diferidos (`yyyy-mm-dd`). */
  scheduledFor: string;
  /** Etiqueta de recurrencia (semanal, mensual…). */
  recurrence: string;
  /** ISO 8601 UTC. */
  createdAt: string;
}

export interface CreateExpensePayload {
  date: string;
  concept: string;
  category: string;
  type: ExpenseType;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  includesVat: boolean;
  irRetention: number;
  beneficiary: string;
  notes: string;
  scheduledFor: string;
  recurrence: string;
}

export interface ExpenseFilters {
  period: ExpensePeriod;
  status: ExpenseStatusFilter;
  type: 'all' | ExpenseType;
  category: string;
  paymentMethod: 'all' | ExpensePaymentMethod;
  beneficiary: string;
  search: string;
}

export interface ExpensesSummary {
  day: number;
  month: number;
  year: number;
  pending: number;
  recurringActive: number;
  salariesPending: number;
}

export interface ExpensesMutationResult {
  ok: boolean;
  message?: string;
}
