import type {
  CompanySalePaymentFilter,
  CompanySalePaymentMethod,
  CompanySalePeriod,
} from '../models/company-sale.model';

/** Clave base de las ventas locales; se sufija con el tenant activo. */
export const COMPANY_SALES_STORAGE_KEY = 'ecom_company_sales';

/** Filas por página del historial de ventas. */
export const COMPANY_SALE_PAGE_SIZE = 10;

/** Tope defensivo de ventas locales guardadas por empresa. */
export const COMPANY_SALE_MAX_RECORDS = 500;

/** Compras necesarias para considerar recurrente a un cliente. */
export const COMPANY_SALE_RECURRING_ORDERS = 3;

/** Días usados para estimar la próxima compra de un cliente recurrente. */
export const COMPANY_SALE_RECURRING_DAYS = 30;

/** Nombre de proveedor por defecto cuando la empresa aún no tiene tiendas. */
export const COMPANY_SALE_DEFAULT_PROVIDER = 'Mi empresa';

/** Clave de storage aislada por empresa; sin tenant usa un espacio seguro. */
export function companySalesStorageKey(tenantId?: string | null): string {
  const suffix =
    (tenantId ?? 'default')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'default';
  return `${COMPANY_SALES_STORAGE_KEY}_${suffix}`;
}

/** Pestañas de periodo del historial. */
export const COMPANY_SALE_PERIODS: readonly { value: CompanySalePeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
  { value: 'custom', label: 'Personalizado' },
];

/** Chips de forma de pago del historial. */
export const COMPANY_SALE_PAYMENT_FILTERS: readonly {
  value: CompanySalePaymentFilter;
  label: string;
}[] = [
  { value: 'all', label: 'Todas' },
  { value: 'cash', label: 'Contado' },
  { value: 'credit', label: 'A crédito' },
  { value: 'pending', label: 'Con saldo pendiente' },
];

/** Formas de pago del POS con su icono. */
export const COMPANY_SALE_PAYMENT_METHODS: readonly {
  value: CompanySalePaymentMethod;
  label: string;
  icon: string;
}[] = [
  { value: 'efectivo', label: 'Efectivo', icon: 'fa-solid fa-money-bill-wave' },
  { value: 'tarjeta', label: 'Tarjeta', icon: 'fa-solid fa-credit-card' },
  { value: 'transferencia', label: 'Transferencia', icon: 'fa-solid fa-building-columns' },
  { value: 'paypal', label: 'PayPal', icon: 'fa-brands fa-paypal' },
  { value: 'otro', label: 'Otro', icon: 'fa-solid fa-coins' },
  { value: 'separado', label: 'Pago separado', icon: 'fa-solid fa-clock-rotate-left' },
];

/** Crea un id local estable para una línea de venta. */
export function createCompanySaleLineId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return `line-${random}`;
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Etiquetas legibles de las formas de pago. */
export const COMPANY_SALE_PAYMENT_LABELS: Readonly<Record<CompanySalePaymentMethod, string>> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  paypal: 'PayPal',
  otro: 'Otro',
  separado: 'Pago separado',
};
