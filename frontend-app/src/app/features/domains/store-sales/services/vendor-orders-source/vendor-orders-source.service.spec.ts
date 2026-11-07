import { of } from 'rxjs';
import { createVendorOrdersSource } from './vendor-orders-source.service';
import type { VendorOrderRepository } from '../../repositories/vendor-order.repository';
import type { VendorOrder } from '../../models/vendor-order.model';

const ORDER: VendorOrder = {
  id: 'PED-1',
  clientId: 'cl-1',
  clientName: 'Salón Vero',
  createdAt: '2026-10-27T12:00:00.000Z',
  status: 'pendiente',
  total: 100,
  lines: [],
  notes: '',
};

function createRepository(): VendorOrderRepository {
  return {
    listOrders: vi.fn(() => of([ORDER])),
    getOrder: vi.fn(() => of(ORDER)),
    createOrder: vi.fn(() => of(ORDER)),
    updateStatus: vi.fn(() => of<VendorOrder>({ ...ORDER, status: 'completado' })),
  };
}

describe('createVendorOrdersSource', () => {
  it('debe delegar listado, detalle y cambio de estado en el repositorio', () => {
    const repository = createRepository();
    const source = createVendorOrdersSource(repository);

    const orders: VendorOrder[] = [];
    source.list().subscribe((result) => orders.push(...result));
    source.detail?.('PED-1').subscribe();
    source.updateStatus?.('PED-1', 'completado').subscribe();

    expect(repository.listOrders).toHaveBeenCalledTimes(1);
    expect(repository.getOrder).toHaveBeenCalledWith('PED-1');
    expect(repository.updateStatus).toHaveBeenCalledWith('PED-1', 'completado');
    expect(orders).toEqual([ORDER]);
  });
});
