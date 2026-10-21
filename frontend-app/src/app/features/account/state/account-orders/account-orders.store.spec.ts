import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AccountOrdersStore } from './account-orders.store';
import { ORDER_REPOSITORY } from '../../../cart/public-api';
import type { OrderResponse } from '../../../cart/public-api';

const orders: OrderResponse[] = [
  { id: 'o-1', orderNumber: 'PED-1', status: 'pendiente', total: 100, createdAt: '2026-01-01' },
];

describe('AccountOrdersStore', () => {
  const repository = { getOrders: vi.fn(() => of(orders)) };

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [AccountOrdersStore, { provide: ORDER_REPOSITORY, useValue: repository }],
    });
    return TestBed.inject(AccountOrdersStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository.getOrders.mockReturnValue(of(orders));
    TestBed.resetTestingModule();
  });

  it('debe cargar el historial de pedidos', async () => {
    const store = setup();

    store.loadOrders();

    await vi.waitFor(() => expect(store.loading()).toBe(false));
    expect(store.orders()).toEqual(orders);
    expect(store.error()).toBeNull();
  });

  it('debe exponer el error cuando falla la carga', async () => {
    repository.getOrders.mockReturnValueOnce(throwError(() => new Error('sin red')));
    const store = setup();

    store.loadOrders();

    await vi.waitFor(() => expect(store.loading()).toBe(false));
    expect(store.error()).toBe('sin red');
  });
});
