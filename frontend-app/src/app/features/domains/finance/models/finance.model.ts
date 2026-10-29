export type FinanceTab = 'purchases' | 'expenses' | 'cash';
export type PurchaseStatus = 'pendiente' | 'pagada';
export type ExpenseCategory = 'operativo' | 'personal' | 'servicios' | 'transporte' | 'otro';
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'credito';

export interface PurchaseRecord {
  id: string;
  /** Fecha local en `yyyy-mm-dd`. */
  date: string;
  supplier: string;
  concept: string;
  amount: number;
  status: PurchaseStatus;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface CreatePurchasePayload {
  date: string;
  supplier: string;
  concept: string;
  amount: number;
  status: PurchaseStatus;
}

export interface CreateExpensePayload {
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

/* -------------------------------------------------------------------------- */
/* Caja / Pagos                                                               */
/* -------------------------------------------------------------------------- */

/** Secciones internas de la pantalla de Caja / Pagos. */
export type CashSection = 'movements' | 'methods' | 'closures' | 'petty' | 'banks' | 'transfers';

/** Periodo del historial de movimientos. */
export type CashPeriod = 'hoy' | 'semana' | 'mes' | 'año' | 'personalizado';

/** Dirección del dinero dentro de la caja. */
export type CashMovementType = 'ingreso' | 'egreso';

/** Moneda capturada por el usuario; los totales se consolidan en NIO. */
export type CashCurrency = 'NIO' | 'USD';

/** Categoría funcional del movimiento. */
export type CashMovementCategory =
  'venta' | 'compra' | 'gasto' | 'aporte' | 'retiro' | 'ajuste' | 'transferencia' | 'otro';

/** Origen del movimiento: ligado a otro módulo o capturado a mano. */
export type CashMovementSource =
  'venta' | 'compra' | 'gasto' | 'manual' | 'transferencia' | 'ajuste';

export type CashMovementStatus = 'completado' | 'anulado';

export type CashFlowFilter = 'todos' | 'ingresos' | 'egresos';
export type CashOriginFilter = 'todos' | 'ligados' | 'manuales';
export type CashStatusFilter = 'completados' | 'anulados';

/**
 * Movimiento del libro de caja. `amount` siempre es positivo y se expresa en
 * NIO; `originalAmount` conserva el monto capturado cuando la moneda es USD.
 */
export interface CashMovement {
  id: string;
  /** Fecha local `yyyy-mm-dd`. */
  date: string;
  /** Instante ISO usado para ordenar movimientos del mismo día. */
  createdAt: string;
  type: CashMovementType;
  concept: string;
  amount: number;
  currency: CashCurrency;
  originalAmount: number;
  exchangeRate: number;
  /** Id del método de pago (`efectivo`, `tarjeta`, … o uno personalizado). */
  paymentMethod: string;
  category: CashMovementCategory;
  source: CashMovementSource;
  status: CashMovementStatus;
  /** Código visible del documento de origen (por ejemplo `V-001189`). */
  reference: string;
  observations: string;
  /** Une los dos movimientos generados por una transferencia interna. */
  transferId?: string;
}

export interface CreateCashMovementPayload {
  date: string;
  type: CashMovementType;
  concept: string;
  amount: number;
  paymentMethod: string;
  category?: CashMovementCategory;
  currency?: CashCurrency;
  originalAmount?: number;
  exchangeRate?: number;
  reference?: string;
  observations?: string;
  source?: CashMovementSource;
}

/** Entrada mínima para convertir una venta en movimiento de caja. */
export interface CashSaleInput {
  id: string;
  number: string;
  /** Fecha local `yyyy-mm-dd`. */
  date: string;
  total: number;
  paymentMethod: string;
  paymentLabel: string;
  source: 'order' | 'local';
  cancelled?: boolean;
}

export interface CashPaymentMethodKindOption {
  value: string;
  label: string;
  icon: string;
}

/** Método de pago configurable por la empresa. */
export interface CashPaymentMethod {
  id: string;
  name: string;
  kind: string;
  icon: string;
  active: boolean;
  createdAt: string;
}

export interface CreateCashPaymentMethodPayload {
  name: string;
  kind: string;
  icon?: string;
}

export interface CashPaymentMethodSummary {
  method: CashPaymentMethod;
  count: number;
  income: number;
  expense: number;
  balance: number;
}

export interface CashClosure {
  id: string;
  /** Fecha local `yyyy-mm-dd` del corte. */
  date: string;
  openingBalance: number;
  income: number;
  expense: number;
  expectedBalance: number;
  countedBalance: number;
  difference: number;
  movementsCount: number;
  notes: string;
  closedAt: string;
}

export interface CreateCashClosurePayload {
  date: string;
  countedBalance: number;
  notes?: string;
}

export interface CashClosurePreview {
  date: string;
  openingBalance: number;
  income: number;
  expense: number;
  expectedBalance: number;
  movementsCount: number;
  existing: CashClosure | null;
}

export type PettyCashMovementType = 'reposicion' | 'gasto';

export interface PettyCashFund {
  amount: number;
  responsible: string;
  updatedAt: string;
}

export interface PettyCashMovement {
  id: string;
  /** Fecha local `yyyy-mm-dd`. */
  date: string;
  type: PettyCashMovementType;
  concept: string;
  amount: number;
  createdAt: string;
}

export interface CreatePettyCashMovementPayload {
  date: string;
  type: PettyCashMovementType;
  concept: string;
  amount: number;
}

export interface PettyCashSummary {
  fund: number;
  replenishments: number;
  expenses: number;
  balance: number;
  movementsCount: number;
}

export type CashTransferAccountKind = 'cash' | 'bank';
export type CashTransferStatus = 'completado' | 'anulado';

export interface CashTransfer {
  id: string;
  /** Fecha local `yyyy-mm-dd`. */
  date: string;
  fromId: string;
  fromLabel: string;
  fromKind: CashTransferAccountKind;
  toId: string;
  toLabel: string;
  toKind: CashTransferAccountKind;
  amount: number;
  concept: string;
  notes: string;
  status: CashTransferStatus;
  createdAt: string;
}

export interface CreateCashTransferPayload {
  date: string;
  fromId: string;
  fromLabel: string;
  fromKind: CashTransferAccountKind;
  toId: string;
  toLabel: string;
  toKind: CashTransferAccountKind;
  amount: number;
  concept: string;
  notes?: string;
}

/** Cuenta disponible para transferir (caja o una cuenta bancaria). */
export interface CashTransferAccount {
  id: string;
  label: string;
  kind: CashTransferAccountKind;
  balance: number;
}

export interface CashTransferSummary {
  totalTransferred: number;
  transfersCount: number;
  cancelledCount: number;
}

/** Filtros compartidos por la tabla y el reporte de caja. */
export interface CashMovementFilters {
  period: CashPeriod;
  search: string;
  flow: CashFlowFilter;
  origin: CashOriginFilter;
  status: CashStatusFilter;
  paymentMethod: string;
  category: CashMovementCategory | 'todas';
  customFrom: string;
  customTo: string;
  page?: number;
}

export interface CashLedgerEntry {
  movement: CashMovement;
  /** Saldo corrido después de aplicar el movimiento. */
  balance: number;
}

export interface CashKpis {
  available: number;
  monthIncome: number;
  monthIncomeCount: number;
  monthExpense: number;
  monthExpenseCount: number;
  monthMovements: number;
  otherIncome: number;
  otherExpense: number;
}

export interface CashReport {
  filters: CashMovementFilters;
  entries: CashLedgerEntry[];
  count: number;
  income: number;
  expense: number;
  balance: number;
}

export interface FinanceSummary {
  purchasesTotal: number;
  purchasesPending: number;
  purchasesMonth: number;
  expensesTotal: number;
  expensesMonth: number;
  cashIncome: number;
  cashExpense: number;
  cashBalance: number;
}

export interface FinanceMutationResult {
  ok: boolean;
  message?: string;
  cashMovement?: CashMovement;
  closure?: CashClosure;
  transfer?: CashTransfer;
  pettyMovement?: PettyCashMovement;
  method?: CashPaymentMethod;
}
