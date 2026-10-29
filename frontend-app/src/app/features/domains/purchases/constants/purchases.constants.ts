import type {
  PurchaseCostType,
  PurchaseDocumentSettings,
  PurchaseLogoSize,
  PurchaseOrderStatus,
  PurchasePaymentMethod,
  PurchasePeriod,
  PurchaseStatus,
  PurchaseStatusFilter,
} from '../models/purchase.model';

/** Tope defensivo de documentos guardados por empresa. */
export const PURCHASE_MAX_RECORDS = 1_000;
export const PURCHASE_MAX_SUPPLIERS = 500;
export const PURCHASE_HISTORY_PAGE_SIZE = 8;

export const PURCHASE_PERIODS: readonly { value: PurchasePeriod; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
  { value: 'año', label: 'Año' },
  { value: 'personalizado', label: 'Personalizado' },
];

export const PURCHASE_STATUS_FILTERS: readonly {
  value: PurchaseStatusFilter;
  label: string;
}[] = [
  { value: 'todas', label: 'Todos los estados' },
  { value: 'recibida', label: 'Recibidas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'anulada', label: 'Anuladas' },
];

export const PURCHASE_STATUS_LABELS: Readonly<Record<PurchaseStatus, string>> = {
  recibida: 'Recibida',
  pendiente: 'Pendiente',
  anulada: 'Anulada',
};

export const PURCHASE_ORDER_STATUS_LABELS: Readonly<Record<PurchaseOrderStatus, string>> = {
  pendiente: 'Pendiente',
  convertida: 'Convertida en compra',
  anulada: 'Anulada',
};

export const PURCHASE_PAYMENT_METHODS: readonly {
  value: PurchasePaymentMethod;
  label: string;
}[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'credito', label: 'Crédito' },
  { value: 'otro', label: 'Otro' },
];

export const PURCHASE_PAYMENT_LABELS: Readonly<Record<PurchasePaymentMethod, string>> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  credito: 'Crédito',
  otro: 'Otro',
};

export const PURCHASE_COST_TYPES: readonly { value: PurchaseCostType; label: string }[] = [
  { value: 'inventario', label: 'Mercadería / inventario (como siempre)' },
  { value: 'servicio', label: 'Servicio' },
  { value: 'gasto', label: 'Gasto operativo' },
  { value: 'otro', label: 'Otro costo' },
];

export const PURCHASE_LOGO_SIZES: readonly { value: PurchaseLogoSize; label: string }[] = [
  { value: 'pequeno', label: 'Pequeño' },
  { value: 'mediano', label: 'Mediano' },
  { value: 'grande', label: 'Grande' },
];

export const PURCHASE_LOGO_HEIGHT: Readonly<Record<PurchaseLogoSize, string>> = {
  pequeno: '32px',
  mediano: '48px',
  grande: '68px',
};

export const DEFAULT_PURCHASE_DOCUMENT_SETTINGS: PurchaseDocumentSettings = {
  logoSize: 'mediano',
  headerColor: '#0055FF',
  matchTableColor: true,
  footerMessage: '',
  showRuc: true,
  showAddress: true,
  showPhone: true,
};

/** Clave heredada del módulo de finanzas para migrar compras existentes. */
export function legacyFinancePurchasesKey(tenantId?: string | null): string {
  const suffix =
    (tenantId ?? 'default')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'default';
  return `ecom_company_purchases_${suffix}`;
}

/** Clave de localStorage aislada por empresa; sin tenant usa un espacio seguro. */
export function purchaseStorageKey(
  kind: 'records' | 'orders' | 'suppliers' | 'document',
  tenantId?: string | null,
): string {
  const suffix =
    (tenantId ?? 'default')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80) || 'default';
  return `ecom_company_purchase_${kind}_${suffix}`;
}
