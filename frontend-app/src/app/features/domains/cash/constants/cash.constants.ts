import type {
  CashAccount,
  CashMovementCategory,
  CashMovementStatus,
  CashMovementType,
  CashPaymentMethod,
  CashPeriod,
  CashTab,
} from '../models/cash.model';

export const CASH_MOVEMENT_TYPES: readonly { value: CashMovementType; label: string }[] = [
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'egreso', label: 'Egreso' },
];

export const CASH_CATEGORIES: readonly { value: CashMovementCategory; label: string }[] = [
  { value: 'venta', label: 'Venta' },
  { value: 'cobro', label: 'Cobro' },
  { value: 'deposito', label: 'Depósito' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'aporte', label: 'Aporte' },
  { value: 'pago-proveedor', label: 'Pago a proveedor' },
  { value: 'gasto', label: 'Gasto' },
  { value: 'retiro', label: 'Retiro' },
  { value: 'caja-chica', label: 'Caja chica' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'otro', label: 'Otro' },
];

export const CASH_PAYMENT_METHODS: readonly { value: CashPaymentMethod; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'credito', label: 'Crédito' },
];

export const CASH_STATUSES: readonly { value: CashMovementStatus; label: string }[] = [
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'anulado', label: 'Anulado' },
];

export const CASH_PERIODS: readonly { value: CashPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'month', label: 'Este mes' },
  { value: 'previous', label: 'Mes anterior' },
  { value: 'year', label: 'Este año' },
  { value: 'all', label: 'Todo' },
];

export const CASH_TABS: readonly { value: CashTab; label: string; icon: string }[] = [
  { value: 'movements', label: 'Movimientos', icon: 'fa-arrow-right-arrow-left' },
  { value: 'payment-methods', label: 'Métodos de pago', icon: 'fa-credit-card' },
  { value: 'closures', label: 'Cierres diarios', icon: 'fa-calendar-check' },
  { value: 'petty-cash', label: 'Caja Chica', icon: 'fa-wallet' },
  { value: 'banks', label: 'Bancos', icon: 'fa-building-columns' },
  { value: 'transfers', label: 'Transferencias', icon: 'fa-money-bill-transfer' },
];

export const CASH_ACCOUNTS: readonly CashAccount[] = [
  { value: 'caja-general', label: 'Caja general', kind: 'caja' },
  { value: 'bac', label: 'BAC Credomatic', kind: 'banco' },
  { value: 'lafise', label: 'Banco LAFISE', kind: 'banco' },
  { value: 'banpro', label: 'Banpro', kind: 'banco' },
];

/** Fondo base de caja chica; los movimientos lo aumentan o reducen. */
export const PETTY_CASH_FUND = 2000;

export const CASH_PAGE_SIZE = 5;
export const CASH_MAX_RECORDS = 1000;

/** Clave nueva para no colisionar con el store anterior de finanzas. */
export function cashStorageKey(tenantId?: string | null): string {
  const suffix = normalizeTenant(tenantId);
  return `ecom_company_cash_ledger_${suffix}`;
}

/** Clave del store anterior, usada solo para migrar movimientos. */
export function legacyCashStorageKey(tenantId?: string | null): string {
  const suffix = normalizeTenant(tenantId);
  return `ecom_company_cash_${suffix}`;
}

function normalizeTenant(tenantId?: string | null): string {
  return (
    (tenantId ?? 'default')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'default'
  );
}
