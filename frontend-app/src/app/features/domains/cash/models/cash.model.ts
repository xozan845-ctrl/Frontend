export type CashMovementType = 'ingreso' | 'egreso';
export type CashMovementCategory =
  | 'venta'
  | 'cobro'
  | 'deposito'
  | 'transferencia'
  | 'aporte'
  | 'pago-proveedor'
  | 'gasto'
  | 'retiro'
  | 'caja-chica'
  | 'ajuste'
  | 'otro';
export type CashMovementSource =
  'manual' | 'venta' | 'compra' | 'gasto' | 'transferencia' | 'ajuste' | 'otro';
export type CashPaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'cheque' | 'credito';
export type CashMovementStatus = 'confirmado' | 'pendiente' | 'anulado';
export type CashAccountKind = 'caja' | 'banco';
export type CashPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';
export type CashTab =
  'movements' | 'payment-methods' | 'closures' | 'petty-cash' | 'banks' | 'transfers';
export type CashTypeFilter = 'all' | CashMovementType;
export type CashStatusFilter = 'all' | CashMovementStatus;
export type CashCategoryFilter = 'all' | CashMovementCategory;
export type CashPaymentFilter = 'all' | CashPaymentMethod;

export interface CashAccount {
  value: string;
  label: string;
  kind: CashAccountKind;
}

export interface CashSourceOption {
  value: CashMovementSource;
  label: string;
  locked: boolean;
}

export interface CashMovement {
  id: string;
  /** Fecha local del movimiento en `yyyy-mm-dd`. */
  date: string;
  type: CashMovementType;
  concept: string;
  category: CashMovementCategory;
  amount: number;
  paymentMethod: CashPaymentMethod;
  status: CashMovementStatus;
  /** Cuenta de caja o banco que recibe/entrega el dinero. */
  account: string;
  /** Origen del movimiento: manual, venta, compra, gasto, etc. */
  source: CashMovementSource;
  reference: string;
  counterpart: string;
  notes: string;
  /** ISO 8601 UTC. */
  createdAt: string;
}

export interface CreateCashMovementPayload {
  date: string;
  type: CashMovementType;
  concept: string;
  category: CashMovementCategory;
  amount: number;
  paymentMethod: CashPaymentMethod;
  account: string;
  source?: CashMovementSource;
  reference: string;
  counterpart: string;
  notes: string;
}

export interface CashFilters {
  period: CashPeriod;
  type: CashTypeFilter;
  status: CashStatusFilter;
  category: CashCategoryFilter;
  paymentMethod: CashPaymentFilter;
  search: string;
  dateFrom: string;
  dateTo: string;
}

export interface CashSummary {
  available: number;
  incomeMonth: number;
  incomeCountMonth: number;
  expenseMonth: number;
  expenseCountMonth: number;
  movementsMonth: number;
  otherIncome: number;
  otherExpense: number;
  pettyCash: number;
  banks: number;
}

export interface CashPaymentBreakdown {
  method: CashPaymentMethod;
  label: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

export interface CashDailyClosure {
  date: string;
  income: number;
  expense: number;
  net: number;
  count: number;
  status: 'cerrado' | 'abierto';
}

export interface CashBankAccountSummary {
  account: string;
  label: string;
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export interface CashMovementRow {
  record: CashMovement;
  balance: number;
}

export interface CashMutationResult {
  ok: boolean;
  message?: string;
}

export interface CashReportExport {
  format: 'excel' | 'pdf';
  records: readonly CashMovement[];
  filters: CashFilters;
}
