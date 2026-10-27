import type { OrderResponse } from '../../../cart/public-api';
import { adaptOrdersFromBackend as adaptSharedOrders } from '../../../orders/public-api';

/** Normaliza `GET /orders/empresa` con el adaptador compartido de pedidos. */
export function adaptCompanyOrdersFromBackend(response: unknown): OrderResponse[] {
  return adaptSharedOrders(response).map((order) => ({
    id: order.id,
    orderNumber: order.number,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
    ...(order.storeId ? { storeId: order.storeId } : {}),
    ...(order.buyerId ? { buyerId: order.buyerId } : {}),
    ...(order.commission !== undefined ? { commission: order.commission } : {}),
    ...(order.lines.length > 0
      ? {
          items: order.lines.map((line) => ({
            ofertaId: line.productId,
            sku: line.sku,
            name: line.name,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            storeId: line.storeId ?? order.storeId ?? '',
          })),
        }
      : {}),
  }));
}
