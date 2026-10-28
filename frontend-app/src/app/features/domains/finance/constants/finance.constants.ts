import type {
  CashMovementType,
  ExpenseCategory,
  FinanceTab,
  PaymentMethod,
  PurchaseStatus,
} from '../models/finance.model';

/** Límite de registros locales por colección (compras, gastos o caja). */
export const FINANCE_MAX_RECORDS = 500;

export const FINANCE_TABS: readonly { value: FinanceTab; label: string; path: string }[] = [
  { value: 'purchases', label: 'Compras', path: '/empresa/compras' },
  { value: 'expenses', label: 'Gastos', path: '/empresa/gastos' },
  { value: 'cash', label: 'Caja / Pagos', path: '/empresa/caja' },
];

export const PURCHASE_STATUSES: readonly { value: PurchaseStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagada', label: 'Pagada' },
];

export const EXPENSE_CATEGORIES: readonly { value: ExpenseCategory; label: string }[] = [
  { value: 'operativo', label: 'Operativo' },
  { value: 'personal', label: 'Personal' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'otro', label: 'Otro' },
];

export const PAYMENT_METHODS: readonly { value: PaymentMethod; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'credito', label: 'Crédito' },
];

export const CASH_MOVEMENT_TYPES: readonly { value: CashMovementType; label: string }[] = [
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'egreso', label: 'Egreso' },
];

/** Clave de localStorage aislada por tenant y colección (`R-NC-11`). */
export function financeStorageKey(
  kind: 'purchases' | 'expenses' | 'cash',
  tenantId?: string | null,
): string {
  const suffix =
    (tenantId ?? 'default')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'default';
  return `ecom_company_${kind}_${suffix}`;
}
