import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OrderStore } from './order.store';
import { OrderResponse } from '../models/order.model';
import { ORDER_REPOSITORY } from '../repositories/order.repository';

const order: OrderResponse = {
  id: 'ord-1',
  orderNumber: 'ORD-123456',
  status: 'creada',
  total: 2760,
  createdAt: '2026-10-08T10:00:00.000Z',
};

describe('OrderStore', () => {
  const orderRepo = { createOrder: vi.fn(() => of(order)) };

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ORDER_REPOSITORY, useValue: orderRepo }],
    });
    return TestBed.inject(OrderStore);
  };

  beforeEach(() => {
    sessionStorage.clear();
    orderRepo.createOrder.mockReturnValue(of(order));
    TestBed.resetTestingModule();
  });

  afterEach(() => sessionStorage.clear());

  it('debe iniciar sin orden', () => {
    const store = setup();

    expect(store.lastOrder()).toBeNull();
  });

  it('debe guardar la última orden y persistirla en sessionStorage', async () => {
    const store = setup();

    store.setLastOrder(order);

    expect(store.lastOrder()).toEqual(order);
    await vi.waitFor(() =>
      expect(sessionStorage.getItem('ecom_last_order')).toBe(JSON.stringify(order)),
    );
  });

  it('debe restaurar la última orden desde sessionStorage', () => {
    sessionStorage.setItem('ecom_last_order', JSON.stringify(order));

    const store = setup();

    expect(store.lastOrder()).toEqual(order);
  });

  it('debe crear la orden y dejarla como última', () => {
    const store = setup();
    let result: OrderResponse | undefined;

    store.placeOrder({ usarCarrito: true }).subscribe((created) => (result = created));

    expect(orderRepo.createOrder).toHaveBeenCalledWith({ usarCarrito: true });
    expect(result).toEqual(order);
    expect(store.lastOrder()).toEqual(order);
  });
});
