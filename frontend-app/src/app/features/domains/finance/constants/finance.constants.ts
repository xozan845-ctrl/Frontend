import type {
  CashMovementCategory,
  CashMovementSource,
  CashPaymentMethod,
  CashPeriod,
  CashSection,
  CashStatusFilter,
  CashTransferAccountKind,
  CashFlowFilter,
  CashOriginFilter,
  CashCurrency,
  ExpenseCategory,
  FinanceTab,
  PaymentMethod,
  PurchaseStatus,
} from '../models/finance.model';

/** Límite de registros locales por colección (compras, gastos o caja). */
export const FINANCE_MAX_RECORDS = 500;

/** Tope de movimientos de caja (incluye ventas convertidas en memoria). */
export const CASH_MAX_RECORDS = 2_000;

/** Tope de movimientos auxiliares de caja chica. */
export const CASH_PETTY_MAX_RECORDS = 500;

/** Filas por página del libro de caja. */
export const CASH_PAGE_SIZE = 15;

/** Tipo de cambio de referencia para capturas en dólares. */
export const CASH_USD_RATE = 36.6243;

/** Identificador de la caja física dentro de las transferencias. */
export const CASH_TRANSFER_CASH_ID = 'cash';

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

export const CASH_MOVEMENT_TYPES: readonly {
  value: 'ingreso' | 'egreso';
  label: string;
  icon: string;
}[] = [
  { value: 'ingreso', label: 'Ingreso', icon: 'fa-solid fa-heart' },
  { value: 'egreso', label: 'Egreso', icon: 'fa-solid fa-arrow-trend-down' },
];

export const CASH_SECTIONS: readonly {
  value: CashSection;
  label: string;
  icon: string;
}[] = [
  { value: 'movements', label: 'Movimientos', icon: 'fa-solid fa-list-ul' },
  { value: 'methods', label: 'Métodos de pago', icon: 'fa-solid fa-credit-card' },
  { value: 'closures', label: 'Cierres diarios', icon: 'fa-solid fa-file-invoice' },
  { value: 'petty', label: 'Caja Chica', icon: 'fa-solid fa-wallet' },
  { value: 'banks', label: 'Bancos', icon: 'fa-solid fa-building-columns' },
  { value: 'transfers', label: 'Transferencias', icon: 'fa-solid fa-right-left' },
];

export const CASH_PERIODS: readonly { value: CashPeriod; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
  { value: 'año', label: 'Año' },
  { value: 'personalizado', label: 'Personalizado' },
];

export const CASH_FLOWS: readonly { value: CashFlowFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ingresos', label: 'Solo ingresos' },
  { value: 'egresos', label: 'Solo egresos' },
];

export const CASH_ORIGINS: readonly { value: CashOriginFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ligados', label: 'Ligados (ventas, compras, gastos…)' },
  { value: 'manuales', label: 'Manuales de Caja' },
];

export const CASH_STATUS_FILTERS: readonly { value: CashStatusFilter; label: string }[] = [
  { value: 'completados', label: 'Completados' },
  { value: 'anulados', label: 'Anulados (solo consulta)' },
];

export const CASH_CURRENCIES: readonly { value: CashCurrency; label: string }[] = [
  { value: 'NIO', label: 'Córdobas (NIO)' },
  { value: 'USD', label: 'Dólares (USD)' },
];

export const CASH_MOVEMENT_CATEGORIES: readonly {
  value: CashMovementCategory;
  label: string;
  icon: string;
}[] = [
  { value: 'venta', label: 'Venta', icon: 'fa-solid fa-cart-shopping' },
  { value: 'compra', label: 'Compra', icon: 'fa-solid fa-boxes-stacked' },
  { value: 'gasto', label: 'Gasto', icon: 'fa-solid fa-receipt' },
  { value: 'aporte', label: 'Aporte', icon: 'fa-solid fa-hand-holding-dollar' },
  { value: 'retiro', label: 'Retiro', icon: 'fa-solid fa-money-bill-transfer' },
  { value: 'ajuste', label: 'Ajuste', icon: 'fa-solid fa-sliders' },
  { value: 'transferencia', label: 'Transferencia', icon: 'fa-solid fa-right-left' },
  { value: 'otro', label: 'Otro', icon: 'fa-solid fa-circle-dot' },
];

export const CASH_MOVEMENT_SOURCES: readonly {
  value: CashMovementSource;
  label: string;
}[] = [
  { value: 'venta', label: 'Venta' },
  { value: 'compra', label: 'Compra' },
  { value: 'gasto', label: 'Gasto' },
  { value: 'manual', label: 'Manual' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'ajuste', label: 'Ajuste' },
];

export const CASH_PAYMENT_METHOD_KINDS: readonly {
  value: string;
  label: string;
  icon: string;
}[] = [
  { value: 'efectivo', label: 'Efectivo', icon: 'fa-solid fa-money-bill-wave' },
  { value: 'tarjeta', label: 'Tarjeta', icon: 'fa-solid fa-credit-card' },
  { value: 'transferencia', label: 'Transferencia', icon: 'fa-solid fa-building-columns' },
  { value: 'credito', label: 'Crédito', icon: 'fa-solid fa-clock-rotate-left' },
  { value: 'wallet', label: 'Billetera digital', icon: 'fa-solid fa-mobile-screen' },
  { value: 'cheque', label: 'Cheque', icon: 'fa-solid fa-money-check' },
  { value: 'otro', label: 'Otro', icon: 'fa-solid fa-coins' },
];

export const CASH_TRANSFER_ACCOUNT_KINDS: readonly {
  value: CashTransferAccountKind;
  label: string;
}[] = [
  { value: 'cash', label: 'Caja' },
  { value: 'bank', label: 'Banco' },
];

/** Métodos de pago con los que arranca una empresa sin configuración previa. */
export const DEFAULT_CASH_PAYMENT_METHODS: readonly Omit<CashPaymentMethod, 'createdAt'>[] = [
  {
    id: 'efectivo',
    name: 'Efectivo',
    kind: 'efectivo',
    icon: 'fa-solid fa-money-bill-wave',
    active: true,
  },
  {
    id: 'tarjeta',
    name: 'Tarjeta',
    kind: 'tarjeta',
    icon: 'fa-solid fa-credit-card',
    active: true,
  },
  {
    id: 'transferencia',
    name: 'Transferencia',
    kind: 'transferencia',
    icon: 'fa-solid fa-building-columns',
    active: true,
  },
  {
    id: 'credito',
    name: 'Crédito',
    kind: 'credito',
    icon: 'fa-solid fa-clock-rotate-left',
    active: true,
  },
  {
    id: 'otro',
    name: 'Otro',
    kind: 'otro',
    icon: 'fa-solid fa-coins',
    active: true,
  },
];

export function cashCategoryLabel(category: CashMovementCategory): string {
  return CASH_MOVEMENT_CATEGORIES.find((item) => item.value === category)?.label ?? 'Otro';
}

/** Clave de localStorage aislada por tenant y colección (`R-NC-11`). */
export function financeStorageKey(
  kind:
    | 'purchases'
    | 'expenses'
    | 'cash'
    | 'cash-methods'
    | 'cash-closures'
    | 'cash-petty'
    | 'cash-petty-fund'
    | 'cash-transfers',
  tenantId?: string | null,
): string {
  const suffix =
    (tenantId ?? 'default')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'default';
  return `ecom_company_${kind}_${suffix}`;
}
