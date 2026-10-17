/**
 * API pública del feature `vendor` para dominios consumidores (`R-CX-6`).
 * Las rutas del panel se cargan de forma perezosa desde `vendor.routes.ts`.
 */
export {
  CLIENT_SEARCH_DEBOUNCE_MS,
  ORDER_STATUS_LABELS,
  VENDOR_DRAFT_STORAGE_KEY,
  VENDOR_POLL_INTERVAL_MS,
  VENDOR_TAX_RATE,
} from './constants/vendor.constants';
export type {
  Client,
  CreateClientPayload,
  CreateOrderPayload,
  DeliveryMethod,
  OrderDraft,
  OrderDraftInfo,
  OrderDraftLine,
  OrderLine,
  OrderStatus,
  VendorOrder,
  VendorProduct,
} from './models/vendor-order.model';
export { ClientSearchStore } from './state/client-search.store';
export { OrderDraftStore } from './state/order-draft.store';
export { VendorCatalogStore } from './state/vendor-catalog.store';
export { VendorOrdersStore } from './state/vendor-orders.store';
