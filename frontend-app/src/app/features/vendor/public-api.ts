/**
 * API pública del feature `vendor` para dominios consumidores (`R-CX-6`).
 * Las rutas del panel se cargan de forma perezosa desde `vendor.routes.ts`.
 */
export {
  CLIENT_SEARCH_DEBOUNCE_MS,
  ORDER_STATUS_ACTIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
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
export type {
  UpdateOfferMarginData,
  VendorOffer,
  VendorOfferPage,
} from './models/vendor-offer.model';
export { createVendorOrdersSource } from './services/vendor-orders-source/vendor-orders-source.service';
export { CLIENT_REPOSITORY, type ClientRepository } from './repositories/client.repository';
export {
  VENDOR_ORDER_REPOSITORY,
  VENDOR_ORDERS_SOURCE,
  type VendorOrderRepository,
} from './repositories/vendor-order.repository';
export {
  VENDOR_PRODUCT_REPOSITORY,
  type VendorProductRepository,
} from './repositories/vendor-product.repository';
export { RecentOrdersTableComponent } from './components/recent-orders-table/recent-orders-table.component';
export { ClientSearchStore } from './state/client-search/client-search.store';
export { OrderDraftStore } from './state/order-draft/order-draft.store';
export { VendorCatalogStore } from './state/vendor-catalog/vendor-catalog.store';
export { VendorOffersStore } from './state/vendor-offers/vendor-offers.store';
export { VendorOrdersStore } from './state/vendor-orders/vendor-orders.store';
export { VendorStoreStore } from './state/vendor-store/vendor-store.store';
