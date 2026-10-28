import { FINANCE_MAX_RECORDS } from '../../constants/finance.constants';
import type {
  CashMovement,
  CashMovementType,
  CreateCashMovementPayload,
  CreateExpensePayload,
  CreatePurchasePayload,
  ExpenseCategory,
  ExpenseRecord,
  FinanceSummary,
  PaymentMethod,
  PurchaseRecord,
  PurchaseStatus,
} from '../../models/finance.model';

const PURCHASE_STATUS_VALUES: readonly PurchaseStatus[] = ['pendiente', 'pagada'];
const EXPENSE_CATEGORY_VALUES: readonly ExpenseCategory[] = [
  'operativo',
  'personal',
  'servicios',
  'transporte',
  'otro',
];
const PAYMENT_METHOD_VALUES: readonly PaymentMethod[] = [
  'efectivo',
  'tarjeta',
  'transferencia',
  'credito',
];
const CASH_TYPE_VALUES: readonly CashMovementType[] = ['ingreso', 'egreso'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Fecha local `yyyy-mm-dd` válida; cadena vacía si no lo es. */
function toDate(value: unknown): string {
  const text = toText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '';
  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '' : text;
}

/** Importe positivo redondeado a dos decimales; 0 si no es válido. */
function toAmount(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * 100) / 100;
}

function includes<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function sanitizeList<T>(value: unknown, adapt: (item: Record<string, unknown>) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (isRecord(item) ? adapt(item) : null))
    .filter((item): item is T => item !== null)
    .slice(0, FINANCE_MAX_RECORDS);
}

function adaptPurchase(raw: Record<string, unknown>): PurchaseRecord | null {
  const id = toText(raw['id']);
  const date = toDate(raw['date']);
  const supplier = toText(raw['supplier']);
  const concept = toText(raw['concept']);
  const amount = toAmount(raw['amount']);
  const status = raw['status'];
  if (
    !id ||
    !date ||
    !supplier ||
    !concept ||
    amount === 0 ||
    !includes(PURCHASE_STATUS_VALUES, status)
  ) {
    return null;
  }
  return { id, date, supplier, concept, amount, status };
}

function adaptExpense(raw: Record<string, unknown>): ExpenseRecord | null {
  const id = toText(raw['id']);
  const date = toDate(raw['date']);
  const description = toText(raw['description']);
  const amount = toAmount(raw['amount']);
  const category = raw['category'];
  const paymentMethod = raw['paymentMethod'];
  if (
    !id ||
    !date ||
    !description ||
    amount === 0 ||
    !includes(EXPENSE_CATEGORY_VALUES, category) ||
    !includes(PAYMENT_METHOD_VALUES, paymentMethod)
  ) {
    return null;
  }
  return { id, date, category, description, amount, paymentMethod };
}

function adaptCash(raw: Record<string, unknown>): CashMovement | null {
  const id = toText(raw['id']);
  const date = toDate(raw['date']);
  const concept = toText(raw['concept']);
  const amount = toAmount(raw['amount']);
  const type = raw['type'];
  const paymentMethod = raw['paymentMethod'];
  if (
    !id ||
    !date ||
    !concept ||
    amount === 0 ||
    !includes(CASH_TYPE_VALUES, type) ||
    !includes(PAYMENT_METHOD_VALUES, paymentMethod)
  ) {
    return null;
  }
  return { id, date, concept, amount, type, paymentMethod };
}

/** Normaliza compras persistidas y descarta registros inválidos. */
export function sanitizePurchaseRecords(value: unknown): PurchaseRecord[] {
  return sanitizeList(value, adaptPurchase);
}

/** Normaliza gastos persistidos y descarta registros inválidos. */
export function sanitizeExpenseRecords(value: unknown): ExpenseRecord[] {
  return sanitizeList(value, adaptExpense);
}

/** Normaliza movimientos de caja persistidos y descarta registros inválidos. */
export function sanitizeCashMovements(value: unknown): CashMovement[] {
  return sanitizeList(value, adaptCash);
}

export function createFinanceId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return `${prefix}-${random}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createPurchaseRecord(payload: CreatePurchasePayload): PurchaseRecord | null {
  const date = toDate(payload.date);
  const supplier = toText(payload.supplier);
  const concept = toText(payload.concept);
  const amount = toAmount(payload.amount);
  if (!date || !supplier || !concept || amount === 0) return null;
  return {
    id: createFinanceId('purchase'),
    date,
    supplier,
    concept,
    amount,
    status: payload.status,
  };
}

export function createExpenseRecord(payload: CreateExpensePayload): ExpenseRecord | null {
  const date = toDate(payload.date);
  const description = toText(payload.description);
  const amount = toAmount(payload.amount);
  if (!date || !description || amount === 0) return null;
  return {
    id: createFinanceId('expense'),
    date,
    category: payload.category,
    description,
    amount,
    paymentMethod: payload.paymentMethod,
  };
}

export function createCashMovement(payload: CreateCashMovementPayload): CashMovement | null {
  const date = toDate(payload.date);
  const concept = toText(payload.concept);
  const amount = toAmount(payload.amount);
  if (!date || !concept || amount === 0) return null;
  return {
    id: createFinanceId('cash'),
    date,
    type: payload.type,
    concept,
    amount,
    paymentMethod: payload.paymentMethod,
  };
}

function isCurrentMonth(date: string, now: Date): boolean {
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return date.startsWith(month);
}

/** Totales y saldo de caja para las tarjetas de la página. */
export function computeFinanceSummary(
  purchases: readonly PurchaseRecord[],
  expenses: readonly ExpenseRecord[],
  cash: readonly CashMovement[],
  now: Date = new Date(),
): FinanceSummary {
  let purchasesTotal = 0;
  let purchasesPending = 0;
  let purchasesMonth = 0;
  for (const purchase of purchases) {
    purchasesTotal += purchase.amount;
    if (purchase.status === 'pendiente') purchasesPending += purchase.amount;
    if (isCurrentMonth(purchase.date, now)) purchasesMonth += purchase.amount;
  }

  let expensesTotal = 0;
  let expensesMonth = 0;
  for (const expense of expenses) {
    expensesTotal += expense.amount;
    if (isCurrentMonth(expense.date, now)) expensesMonth += expense.amount;
  }

  let cashIncome = 0;
  let cashExpense = 0;
  for (const movement of cash) {
    if (movement.type === 'ingreso') cashIncome += movement.amount;
    else cashExpense += movement.amount;
  }

  return {
    purchasesTotal: Math.round(purchasesTotal * 100) / 100,
    purchasesPending: Math.round(purchasesPending * 100) / 100,
    purchasesMonth: Math.round(purchasesMonth * 100) / 100,
    expensesTotal: Math.round(expensesTotal * 100) / 100,
    expensesMonth: Math.round(expensesMonth * 100) / 100,
    cashIncome: Math.round(cashIncome * 100) / 100,
    cashExpense: Math.round(cashExpense * 100) / 100,
    cashBalance: Math.round((cashIncome - cashExpense) * 100) / 100,
  };
}
