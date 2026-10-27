import type { OrdersDataSource } from '../../../../shared/orders/repositories/orders-data-source/orders-data-source.repository';
import type { OrderStatus, VendorOrder } from '../../models/vendor-order.model';
import type { VendorOrderRepository } from '../../repositories/vendor-order.repository';

/** Adapta el puerto de pedidos del vendedor al store compartido (ADR-62). */
export function createVendorOrdersSource(
  repository: VendorOrderRepository,
): OrdersDataSource<VendorOrder, OrderStatus> {
  return {
    list: () => repository.listOrders(),
    detail: (id) => repository.getOrder(id),
    updateStatus: (id, status) => repository.updateStatus(id, status),
  };
}
