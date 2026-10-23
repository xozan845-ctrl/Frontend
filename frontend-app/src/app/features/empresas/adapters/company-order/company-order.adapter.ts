import { adaptOrderListFromBackend, type OrderResponse } from '../../../cart/public-api';

/** Normaliza `GET /orders/empresa` con el adapter compartido del checkout. */
export function adaptCompanyOrdersFromBackend(response: unknown): OrderResponse[] {
  return adaptOrderListFromBackend(response);
}
