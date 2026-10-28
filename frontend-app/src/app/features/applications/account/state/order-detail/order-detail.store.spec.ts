import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OrderDetailStore } from './order-detail.store';
import { ORDER_REPOSITORY } from '../../../cart/public-api';
import type { OrderResponse, OrderTimelineEvent } from '../../../cart/public-api';

const order: OrderResponse = {
  id: 'o-1',
  orderNumber: 'PED-1',
  status: 'pendiente',
  total: 100,
  createdAt: '2026-01-01',
};
const timeline: OrderTimelineEvent[] = [
  { id: 1, type: 'creado', payload: {}, version: 1, createdAt: '2026-01-01' },
];

describe('OrderDetailStore', () => {
  const repository = {
    getOrder: vi.fn(() => of(order)),
    getTimeline: vi.fn(() => of(timeline)),
  };

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [OrderDetailStore, { provide: ORDER_REPOSITORY, useValue: repository }],
    });
    return TestBed.inject(OrderDetailStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository.getOrder.mockReturnValue(of(order));
    repository.getTimeline.mockReturnValue(of(timeline));
    TestBed.resetTestingModule();
  });

  it('debe cargar el pedido y su timeline', async () => {
    const store = setup();

    store.loadOrder('o-1');

    await vi.waitFor(() => expect(store.loading()).toBe(false));
    expect(store.order()).toEqual(order);
    expect(store.timeline()).toEqual(timeline);
  });

  it('debe exponer el error cuando falla el pedido', async () => {
    repository.getOrder.mockReturnValueOnce(throwError(() => new Error('no existe')));
    const store = setup();

    store.loadOrder('o-404');

    await vi.waitFor(() => expect(store.loading()).toBe(false));
    expect(store.error()).toBe('no existe');
  });
});
