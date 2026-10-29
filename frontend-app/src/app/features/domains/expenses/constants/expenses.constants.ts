import type {
  ExpensePeriod,
  ExpensePaymentMethod,
  ExpenseStatus,
  ExpenseStatusFilter,
  ExpenseType,
} from '../models/expense.model';

export const EXPENSE_CATEGORIES: readonly { value: string; label: string }[] = [
  { value: 'publicidad', label: 'Publicidad' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'otros', label: 'Otros' },
  { value: 'salarios', label: 'Salarios' },
  { value: 'renta', label: 'Renta' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'suministros', label: 'Suministros' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
];

export const EXPENSE_TYPES: readonly { value: ExpenseType; label: string }[] = [
  { value: 'inmediato', label: 'Inmediato' },
  { value: 'programado', label: 'Programado' },
  { value: 'recurrente', label: 'Recurrente' },
];

export const EXPENSE_STATUSES: readonly { value: ExpenseStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export const EXPENSE_PAYMENT_METHODS: readonly {
  value: ExpensePaymentMethod;
  label: string;
}[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'credito', label: 'Crédito' },
];

export const EXPENSE_PERIODS: readonly { value: ExpensePeriod; label: string }[] = [
  { value: 'month', label: 'Este mes' },
  { value: 'previous', label: 'Mes anterior' },
  { value: 'year', label: 'Este año' },
  { value: 'all', label: 'Todo' },
];

export const EXPENSE_STATUS_FILTERS: readonly {
  value: ExpenseStatusFilter;
  label: string;
}[] = [
  { value: 'active', label: 'Activos' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'all', label: 'Todos' },
];

export const EXPENSES_PAGE_SIZE = 5;
export const EXPENSES_MAX_RECORDS = 1000;

/** Clave nueva para no colisionar con el store anterior de finanzas. */
export function expensesStorageKey(tenantId?: string | null): string {
  const suffix =
    (tenantId ?? 'default')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'default';
  return `ecom_company_expenses_ledger_${suffix}`;
}

/** Clave del store anterior, usada solo para migrar registros. */
export function legacyExpensesStorageKey(tenantId?: string | null): string {
  const suffix =
    (tenantId ?? 'default')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'default';
  return `ecom_company_expenses_${suffix}`;
}
