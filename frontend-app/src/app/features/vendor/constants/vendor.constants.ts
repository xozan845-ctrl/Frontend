import { OrderStatus } from '../models/vendor-order.model';

/** IVA aplicado al POS del vendedor (15 %, parametrizable, ADR-20). */
export const VENDOR_TAX_RATE = 0.15;

/** Cadencia del polling de pedidos recientes (`R-PF-6`), pausable con la pestaña oculta. */
export const VENDOR_POLL_INTERVAL_MS = 15000;

/** Espera simulada del modo `mock` para que la UI muestre sus estados de carga. */
export const VENDOR_MOCK_DELAY_MS = 350;

/** Clave del borrador del pedido en `localStorage` (`R-ST-7`, `R-NC-11`). */
export const VENDOR_DRAFT_STORAGE_KEY = 'ecom_vendor_order_draft';

/** Etiquetas humanas de estado para las tablas y badges del panel (`R-UX-4`). */
export const ORDER_STATUS_LABELS: Readonly<Record<OrderStatus, string>> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completado: 'Completado',
  cancelado: 'Cancelado',
};
