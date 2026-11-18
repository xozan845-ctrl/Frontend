import type { VendorDraftScope } from '../models/vendor-draft.model';
import { OrderStatus } from '../models/vendor-order.model';

/** IVA aplicado al POS del vendedor (15 %, parametrizable, ADR-20). */
export const VENDOR_TAX_RATE = 0.15;

/** Cadencia del polling de pedidos recientes (`R-PF-6`), pausable con la pestaña oculta. */
export const VENDOR_POLL_INTERVAL_MS = 15000;

/** `debounce` del buscador de clientes del POS (`R-PF-6`). */
export const CLIENT_SEARCH_DEBOUNCE_MS = 300;

/** Prefijo común de las claves del borrador del POS (`R-NC-11`). */
export const VENDOR_DRAFT_STORAGE_PREFIX = 'ecom_vendor_order_draft';

/**
 * Clave global heredada del borrador (`R-ST-7`). No tiene dueño identificable,
 * así que al iniciar el POS se elimina en lugar de migrarla.
 */
export const LEGACY_VENDOR_DRAFT_STORAGE_KEY = VENDOR_DRAFT_STORAGE_PREFIX;

/** Versión del envoltorio persistido; un valor distinto descarta el borrador. */
export const VENDOR_DRAFT_SCHEMA_VERSION = 2;

/** Clave aislada por empresa, tienda y usuario (`R-ST-7`, `R-NC-11`). */
export function vendorDraftStorageKey(scope: VendorDraftScope): string {
  const encode = (value: string): string => encodeURIComponent(value || 'sin-definir');
  return `${VENDOR_DRAFT_STORAGE_PREFIX}:v${VENDOR_DRAFT_SCHEMA_VERSION}:${encode(scope.tenantId)}:${encode(scope.storeId)}:${encode(scope.userId)}`;
}

/** Etiquetas humanas de estado para las tablas y badges del panel (`R-UX-4`). */

/**
 * Transiciones válidas de estado del pedido (`R-RB-3`): los estados finales
 * (`completado`, `cancelado`) no vuelven atrás. Si el backend define otro
 * flujo, se ajusta aquí y en un ADR menor.
 */
export const ORDER_STATUS_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pendiente: ['en_proceso', 'cancelado'],
  en_proceso: ['completado', 'cancelado'],
  completado: [],
  cancelado: [],
};

/** Acción humana por estado destino para el detalle del pedido (`R-UX-4`). */
export const ORDER_STATUS_ACTIONS: Readonly<Partial<Record<OrderStatus, string>>> = {
  en_proceso: 'Marcar en proceso',
  completado: 'Marcar completado',
  cancelado: 'Cancelar pedido',
};
