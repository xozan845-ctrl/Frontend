export type FinanceTab = 'purchases' | 'expenses' | 'cash';
export type PurchaseStatus = 'pendiente' | 'pagada';
export type ExpenseCategory = 'operativo' | 'personal' | 'servicios' | 'transporte' | 'otro';
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'credito';
export type CashMovementType = 'ingreso' | 'egreso';

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

export interface CashMovement {
  id: string;
  date: string;
  type: CashMovementType;
  concept: string;
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

export interface CreateCashMovementPayload {
  date: string;
  type: CashMovementType;
  concept: string;
  amount: number;
  paymentMethod: PaymentMethod;
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
}
