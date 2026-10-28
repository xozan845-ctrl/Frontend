import type { OrdersDataSource } from '../../../../../shared/orders/repositories/orders-data-source/orders-data-source.repository';
import type { OrderResponse } from '../../../cart/public-api';
import type { CompanyPortalRepository } from '../../repositories/company-portal.repository';

/**
 * Adapta `GET /orders/empresa` al store compartido. La pantalla de Ventas es de
 * solo lectura: no expone detalle ni cambio de estado (ADR-62).
 */
export function createCompanyOrdersSource(
  repository: CompanyPortalRepository,
): OrdersDataSource<OrderResponse> {
  return {
    list: () => repository.orders({ limit: 100 }),
  };
}
