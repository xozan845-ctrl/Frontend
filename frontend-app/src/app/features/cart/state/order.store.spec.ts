import { TestBed } from '@angular/core/testing';
import { OrderStore } from './order.store';
import { OrderResponse } from '../models/order.model';

const order: OrderResponse = {
  id: 'ord-1',
  orderNumber: 'ORD-123456',
  status: 'creada',
  total: 2760,
  createdAt: '2026-10-08T10:00:00.000Z',
};

describe('OrderStore', () => {
  const setup = () => {
    TestBed.configureTestingModule({});
    return TestBed.inject(OrderStore);
  };

  beforeEach(() => {
    sessionStorage.clear();
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
});
