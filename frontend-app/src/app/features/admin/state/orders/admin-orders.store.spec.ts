import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminOrdersStore } from './admin-orders.store';
import { ADMIN_ORDER_REPOSITORY } from '../../repositories/admin-order.repository';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import type { OrderResponse } from '../../../cart/public-api';

const order: OrderResponse = {
  id: 'o-1',
  orderNumber: 'ORD-O-1',
  status: 'pagada',
  total: 2300,
  createdAt: '2026-10-22T15:00:00.000Z',
  buyerId: 'c-1',
  sellerId: 'v-1',
  storeId: 't-1',
  items: [
    {
      ofertaId: 'of-1',
      sku: 'SKU-1',
      name: 'Teclado',
      quantity: 2,
      unitPrice: 1150,
      storeId: 't-1',
    },
  ],
};

describe('AdminOrdersStore', () => {
  let repo: {
    listAll: ReturnType<typeof vi.fn>;
    getOrder: ReturnType<typeof vi.fn>;
    getTimeline: ReturnType<typeof vi.fn>;
    advanceStatus: ReturnType<typeof vi.fn>;
  };
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = {
      listAll: vi.fn(() => of([order])),
      getOrder: vi.fn(() => of(order)),
      getTimeline: vi.fn(() =>
        of([
          {
            id: 1,
            type: 'OrderCreatedEvent',
            payload: {},
            version: 1,
            createdAt: '2026-10-22T15:00:00.000Z',
          },
        ]),
      ),
      advanceStatus: vi.fn(() => of({ id: 'o-1', status: 'enviada' })),
    };
    TestBed.configureTestingModule({
      providers: [
        AdminOrdersStore,
        { provide: ADMIN_ORDER_REPOSITORY, useValue: repo },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(AdminOrdersStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar todas las órdenes', async () => {
    const store = setup();

    store.load();

    await vi.waitFor(() => expect(store.orders()).toEqual([order]));
    expect(repo.listAll).toHaveBeenCalledWith(undefined, 100);
    expect(store.loading()).toBe(false);
  });

  it('debe filtrar por estado', async () => {
    const store = setup();

    store.setStatusFilter('pagada');

    await vi.waitFor(() => expect(repo.listAll).toHaveBeenCalledWith('pagada', 100));
  });

  it('debe cargar detalle y timeline al seleccionar una orden', async () => {
    const store = setup();
    store.load();
    await vi.waitFor(() => expect(store.orders()).toHaveLength(1));

    store.selectOrder('o-1');

    await vi.waitFor(() => expect(store.selectedOrder()).toEqual(order));
    expect(store.timeline()).toHaveLength(1);
    expect(repo.getOrder).toHaveBeenCalledWith('o-1');
    expect(repo.getTimeline).toHaveBeenCalledWith('o-1');
  });

  it('debe avanzar el estado y actualizar lista y detalle', async () => {
    const store = setup();
    store.load();
    store.selectOrder('o-1');
    await vi.waitFor(() => expect(store.selectedOrder()).toEqual(order));

    store.advanceStatus({ status: 'enviada', reason: 'despacho' });

    await vi.waitFor(() => expect(store.selectedOrder()?.status).toBe('enviada'));
    expect(repo.advanceStatus).toHaveBeenCalledWith('o-1', 'enviada', 'despacho');
    expect(store.orders()[0]?.status).toBe('enviada');
    expect(notification.showSuccess).toHaveBeenCalledWith('Estado de la orden actualizado.');
  });

  it('no debe avanzar sin orden seleccionada', () => {
    const store = setup();

    store.advanceStatus({ status: 'enviada' });

    expect(repo.advanceStatus).not.toHaveBeenCalled();
    expect(store.selectedError()).toBe('Selecciona una orden.');
  });

  it('debe registrar errores de lista, detalle y transición', async () => {
    const store = setup();
    vi.mocked(repo.listAll).mockReturnValue(throwError(() => new Error('')));
    store.load();
    await vi.waitFor(() => expect(store.error()).toBe('No se pudieron cargar las órdenes.'));

    vi.mocked(repo.getOrder).mockReturnValue(throwError(() => new Error('')));
    store.selectOrder('o-1');
    await vi.waitFor(() => expect(store.selectedError()).toBe('No se pudo cargar la orden.'));

    store.closeOrder();
    vi.mocked(repo.getOrder).mockReturnValue(of(order));
    store.selectOrder('o-1');
    await vi.waitFor(() => expect(store.selectedOrder()).toEqual(order));
    vi.mocked(repo.advanceStatus).mockReturnValue(throwError(() => new Error('')));
    store.advanceStatus({ status: 'enviada' });
    await vi.waitFor(() => expect(store.selectedError()).toBe('No se pudo actualizar el estado.'));
  });

  it('debe cerrar el detalle y reiniciar', async () => {
    const store = setup();
    store.load();
    store.selectOrder('o-1');
    await vi.waitFor(() => expect(store.selectedOrder()).toEqual(order));

    store.closeOrder();
    expect(store.selectedOrder()).toBeNull();
    expect(store.timeline()).toEqual([]);

    store.reset();
    expect(store.orders()).toEqual([]);
  });
});
