import { OrderStatus } from '../models/vendor-order.model';

/** IVA aplicado al POS del vendedor (15 %, parametrizable, ADR-20). */
export const VENDOR_TAX_RATE = 0.15;

/** Cadencia del polling de pedidos recientes (`R-PF-6`), pausable con la pestaña oculta. */
export const VENDOR_POLL_INTERVAL_MS = 15000;

/** `debounce` del buscador de clientes del POS (`R-PF-6`). */
export const CLIENT_SEARCH_DEBOUNCE_MS = 300;

/** Clave del borrador del pedido en `localStorage` (`R-ST-7`, `R-NC-11`). */
export const VENDOR_DRAFT_STORAGE_KEY = 'ecom_vendor_order_draft';

/** Etiquetas humanas de estado para las tablas y badges del panel (`R-UX-4`). */
export const ORDER_STATUS_LABELS: Readonly<Record<OrderStatus, string>> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

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
