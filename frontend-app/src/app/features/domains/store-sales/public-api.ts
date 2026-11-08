/** API pública del dominio de ventas, pedidos y catálogo de tienda (`R-CX-6`). */
export {
  CLIENT_SEARCH_DEBOUNCE_MS,
  ORDER_STATUS_ACTIONS,
  ORDER_STATUS_TRANSITIONS,
  VENDOR_DRAFT_STORAGE_KEY,
  VENDOR_POLL_INTERVAL_MS,
  VENDOR_TAX_RATE,
} from './constants/vendor.constants';
export type {
  PosClient,
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
export { ClientService } from './services/client/client.service';
export { VendorOfferService } from './services/vendor-offer/vendor-offer.service';
export { VendorOrderService } from './services/vendor-order/vendor-order.service';
export { VendorProductService } from './services/vendor-product/vendor-product.service';
export { VendorReportsSource } from './services/vendor-reports/vendor-reports.service';
export { VENDOR_REPORTS_SCOPE_CONFIG } from './constants/vendor-reports.config';
export { CLIENT_REPOSITORY, type ClientRepository } from './repositories/client.repository';
export {
  VENDOR_OFFER_REPOSITORY,
  type VendorOfferRepository,
} from './repositories/vendor-offer.repository';
export {
  VENDOR_ORDER_REPOSITORY,
  VENDOR_ORDERS_SOURCE,
  type VendorOrderRepository,
} from './repositories/vendor-order.repository';
export {
  VENDOR_PRODUCT_REPOSITORY,
  type VendorProductRepository,
} from './repositories/vendor-product.repository';
export { ClientSearchStore } from './state/client-search/client-search.store';
export { OrderDraftStore } from './state/order-draft/order-draft.store';
export { VendorCatalogStore } from './state/vendor-catalog/vendor-catalog.store';
export { VendorOffersStore } from './state/vendor-offers/vendor-offers.store';
export { VendorOrdersStore } from './state/vendor-orders/vendor-orders.store';
