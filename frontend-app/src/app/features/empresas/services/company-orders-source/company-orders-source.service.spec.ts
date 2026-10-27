import { of } from 'rxjs';
import { createCompanyOrdersSource } from './company-orders-source.service';
import type { CompanyPortalRepository } from '../../repositories/company-portal.repository';
import type { OrderResponse } from '../../../cart/public-api';

const ORDER: OrderResponse = {
  id: 'o-1',
  orderNumber: 'ORD-1',
  status: 'pagada',
  total: 300,
  createdAt: '2026-10-27T12:00:00.000Z',
};

function createRepository(): CompanyPortalRepository {
  return {
    orders: vi.fn(() => of<OrderResponse[]>([ORDER])),
    sales: vi.fn(),
    stores: vi.fn(() => of([])),
  };
}

describe('createCompanyOrdersSource', () => {
  it('debe listar las órdenes de empresa con el límite de la pantalla', () => {
    const repository = createRepository();
    const source = createCompanyOrdersSource(repository);

    const orders: OrderResponse[] = [];
    source.list().subscribe((result) => orders.push(...result));

    expect(repository.orders).toHaveBeenCalledWith({ limit: 100 });
    expect(orders).toEqual([ORDER]);
    expect(source.detail).toBeUndefined();
    expect(source.updateStatus).toBeUndefined();
  });
});
