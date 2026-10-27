import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VendorOrdersStore } from './vendor-orders.store';
import {
  VENDOR_ORDER_REPOSITORY,
  VENDOR_ORDERS_SOURCE,
  VendorOrderRepository,
} from '../../repositories/vendor-order.repository';
import { createVendorOrdersSource } from '../../services/vendor-orders-source/vendor-orders-source.service';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { VENDOR_POLL_INTERVAL_MS } from '../../constants/vendor.constants';
import { VendorOrder } from '../../models/vendor-order.model';

const order: VendorOrder = {
  id: 'PED-000125',
  clientId: 'vc-1',
  clientName: 'Carla López',
  createdAt: '2026-10-15T10:32:00Z',
  status: 'en_proceso',
  total: 1339.75,
  lines: [],
  notes: '',
};

describe('VendorOrdersStore', () => {
  let repo: VendorOrderRepository;
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    repo = {
      listOrders: vi.fn(() => of([order])),
      getOrder: vi.fn(() => of(order)),
      createOrder: vi.fn(() => of(order)),
      updateStatus: vi.fn(() => of(order)),
    };
    TestBed.configureTestingModule({
      providers: [
        VendorOrdersStore,
        { provide: VENDOR_ORDER_REPOSITORY, useValue: repo },
        { provide: VENDOR_ORDERS_SOURCE, useValue: createVendorOrdersSource(repo) },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(VendorOrdersStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar los pedidos y marcar la última actualización', async () => {
    const store = setup();

    store.loadOrders();
    await vi.waitFor(() => expect(store.orders()).toHaveLength(1));

    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.lastUpdatedAt()).not.toBeNull();
    expect(repo.listOrders).toHaveBeenCalledTimes(1);
  });

  it('debe derivar los KPIs del inicio con el día local y sin cancelados', async () => {
    const now = new Date();
    const atDay = (daysAgo: number, hours: number): string =>
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hours).toISOString();
    const orders: VendorOrder[] = [
      { ...order, id: 'PED-1', status: 'en_proceso', total: 1000, createdAt: atDay(0, 9) },
      { ...order, id: 'PED-2', status: 'cancelado', total: 500, createdAt: atDay(0, 10) },
      { ...order, id: 'PED-3', status: 'pendiente', total: 700, createdAt: atDay(1, 9) },
      { ...order, id: 'PED-4', status: 'pendiente', total: 300, createdAt: '' },
    ];
    const store = setup();
    vi.mocked(repo.listOrders).mockReturnValue(of(orders));

    store.loadOrders();
    await vi.waitFor(() => expect(store.orders()).toHaveLength(4));

    expect(store.todayKpis()).toEqual({
      soldToday: 1000,
      ordersToday: 2,
      pending: 2,
      inProgress: 1,
    });
  });

  it('debe dejar los KPIs del inicio en cero sin pedidos cargados', () => {
    const store = setup();

    expect(store.todayKpis()).toEqual({ soldToday: 0, ordersToday: 0, pending: 0, inProgress: 0 });
  });

  it('debe guardar la lista vacía cuando no hay pedidos', async () => {
    const store = setup();
    vi.mocked(repo.listOrders).mockReturnValue(of([]));

    store.loadOrders();
    await vi.waitFor(() => expect(store.loading()).toBe(false));

    expect(store.orders()).toEqual([]);
    expect(store.error()).toBeNull();
  });

  it('debe exponer el error del listado con aviso', async () => {
    const store = setup();
    vi.mocked(repo.listOrders).mockReturnValue(throwError(() => new Error('boom')));

    store.loadOrders();
    await vi.waitFor(() => expect(store.error()).toBe('boom'));

    expect(store.loading()).toBe(false);
    expect(notification.showError).toHaveBeenCalledWith('boom');
  });

  it('debe usar el mensaje por defecto del listado', async () => {
    const store = setup();
    vi.mocked(repo.listOrders).mockReturnValue(throwError(() => new Error('')));

    store.loadOrders();
    await vi.waitFor(() => expect(store.error()).toBe('No se pudieron cargar los pedidos.'));
  });

  it('refresh silencioso conserva los pedidos y no notifica cuando falla', async () => {
    const store = setup();

    store.loadOrders();
    await vi.waitFor(() => expect(store.orders()).toHaveLength(1));
    notification.showError.mockClear();

    vi.mocked(repo.listOrders).mockReturnValue(throwError(() => new Error('sin red')));
    store.refresh();
    await vi.waitFor(() => expect(store.error()).toBe('sin red'));

    expect(store.orders()).toHaveLength(1);
    expect(notification.showError).not.toHaveBeenCalled();

    vi.mocked(repo.listOrders).mockReturnValue(throwError(() => new Error('')));
    store.refresh();
    await vi.waitFor(() => expect(store.error()).toBe('No se pudieron cargar los pedidos.'));
  });

  it('refresh actualiza la lista y la marca de tiempo', async () => {
    const store = setup();
    store.loadOrders();
    await vi.waitFor(() => expect(store.orders()).toHaveLength(1));
    const firstUpdate = store.lastUpdatedAt();

    const refreshed: VendorOrder = { ...order, id: 'PED-000126', status: 'pendiente' };
    vi.mocked(repo.listOrders).mockReturnValue(of([refreshed, order]));
    store.refresh();
    await vi.waitFor(() => expect(store.orders()).toHaveLength(2));

    expect(store.orders()[0].id).toBe('PED-000126');
    expect(store.lastUpdatedAt()).not.toBeNull();
    expect(store.lastUpdatedAt()).toBeGreaterThanOrEqual(firstUpdate ?? 0);
    expect(store.error()).toBeNull();
  });

  it('debe derivar la lista filtrada y el conteo por estado', async () => {
    const store = setup();
    const mixed: VendorOrder[] = [
      { ...order, id: 'PED-000127', status: 'pendiente' },
      { ...order, id: 'PED-000126', status: 'en_proceso' },
      { ...order, id: 'PED-000125', status: 'en_proceso' },
      { ...order, id: 'PED-000124', status: 'completado' },
      { ...order, id: 'PED-000123', status: 'cancelado' },
    ];
    vi.mocked(repo.listOrders).mockReturnValue(of(mixed));

    store.loadOrders();
    await vi.waitFor(() => expect(store.orders()).toHaveLength(5));

    expect(store.statusFilter()).toBeNull();
    expect(store.filteredOrders()).toHaveLength(5);
    expect(store.statusCounts()).toEqual({
      pendiente: 1,
      en_proceso: 2,
      completado: 1,
      cancelado: 1,
    });

    store.setStatusFilter('en_proceso');
    expect(store.filteredOrders().map((item) => item.id)).toEqual(['PED-000126', 'PED-000125']);

    store.setStatusFilter(null);
    expect(store.filteredOrders()).toHaveLength(5);
  });

  it('debe cargar el detalle y reflejarlo en la lista', async () => {
    const store = setup();
    store.loadOrders();
    await vi.waitFor(() => expect(store.orders()).toHaveLength(1));

    const detailed: VendorOrder = { ...order, clientName: 'Carla López (detalle)' };
    vi.mocked(repo.getOrder).mockReturnValue(of(detailed));
    store.loadOrder('PED-000125');
    await vi.waitFor(() => expect(store.selectedOrder()).toEqual(detailed));

    expect(store.selectedLoading()).toBe(false);
    expect(store.orders()[0].clientName).toBe('Carla López (detalle)');
  });

  it('debe exponer el error del detalle con aviso y mensaje por defecto', async () => {
    const store = setup();
    vi.mocked(repo.getOrder).mockReturnValue(throwError(() => new Error('sin conexión')));

    store.loadOrder('PED-000404');
    await vi.waitFor(() => expect(store.selectedError()).toBe('sin conexión'));

    expect(store.selectedLoading()).toBe(false);
    expect(notification.showError).toHaveBeenCalledWith('sin conexión');

    vi.mocked(repo.getOrder).mockReturnValue(throwError(() => new Error('')));
    store.loadOrder('PED-000404');
    await vi.waitFor(() => expect(store.selectedError()).toBe('No se pudo cargar el pedido.'));
  });

  it('debe cambiar el estado del pedido abierto y actualizar la lista', async () => {
    const store = setup();
    store.loadOrder('PED-000125');
    await vi.waitFor(() => expect(store.selectedOrder()).not.toBeNull());

    const updated: VendorOrder = { ...order, status: 'completado' };
    vi.mocked(repo.updateStatus).mockReturnValue(of(updated));

    store.updateStatus('completado');
    await vi.waitFor(() => expect(store.selectedOrder()?.status).toBe('completado'));

    expect(repo.updateStatus).toHaveBeenCalledWith('PED-000125', 'completado');
    expect(store.updatingStatus()).toBe(false);
    expect(notification.showSuccess).toHaveBeenCalledWith('Pedido PED-000125 actualizado.');
  });

  it('debe conservar el estado y avisar cuando falla el cambio', async () => {
    const store = setup();
    store.loadOrder('PED-000125');
    await vi.waitFor(() => expect(store.selectedOrder()).not.toBeNull());
    notification.showError.mockClear();

    vi.mocked(repo.updateStatus).mockReturnValue(throwError(() => new Error('conflicto')));
    store.updateStatus('cancelado');
    await vi.waitFor(() => expect(store.selectedError()).toBe('conflicto'));

    expect(store.selectedOrder()?.status).toBe('en_proceso');
    expect(store.updatingStatus()).toBe(false);
    expect(notification.showError).toHaveBeenCalledWith('conflicto');

    vi.mocked(repo.updateStatus).mockReturnValue(throwError(() => new Error('')));
    store.updateStatus('cancelado');
    await vi.waitFor(() =>
      expect(store.selectedError()).toBe('No se pudo actualizar el estado del pedido.'),
    );
  });

  it('no debe llamar al backend sin pedido seleccionado y debe limpiar el detalle', async () => {
    const store = setup();

    store.updateStatus('completado');
    await Promise.resolve();

    expect(repo.updateStatus).not.toHaveBeenCalled();
    expect(store.updatingStatus()).toBe(false);

    store.loadOrder('PED-000125');
    await vi.waitFor(() => expect(store.selectedOrder()).not.toBeNull());

    store.clearSelectedOrder();
    expect(store.selectedOrder()).toBeNull();
    expect(store.selectedError()).toBeNull();
    expect(store.selectedLoading()).toBe(false);
  });

  it('debe sondear con timer y detenerse al salir del modo "en vivo"', async () => {
    vi.useFakeTimers();
    try {
      const store = setup();
      store.startPolling();

      expect(store.live()).toBe(true);
      // La primera carga del sondeo es la visible e inmediata.
      await vi.advanceTimersByTimeAsync(0);
      expect(repo.listOrders).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(VENDOR_POLL_INTERVAL_MS);
      expect(repo.listOrders).toHaveBeenCalledTimes(2);

      store.stopPolling();
      expect(store.live()).toBe(false);
      await vi.advanceTimersByTimeAsync(VENDOR_POLL_INTERVAL_MS * 2);
      expect(repo.listOrders).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('no debe duplicar el sondeo si ya está activo', async () => {
    vi.useFakeTimers();
    try {
      const store = setup();
      store.startPolling();
      store.startPolling();

      await vi.advanceTimersByTimeAsync(0);
      expect(repo.listOrders).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(VENDOR_POLL_INTERVAL_MS);
      expect(repo.listOrders).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('debe pausar el sondeo con la pestaña oculta y refrescar al volver', async () => {
    vi.useFakeTimers();
    const visibility = (state: 'visible' | 'hidden') => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => state,
      });
    };
    try {
      visibility('visible');
      const store = setup();
      store.startPolling();
      await vi.advanceTimersByTimeAsync(VENDOR_POLL_INTERVAL_MS);
      expect(repo.listOrders).toHaveBeenCalledTimes(2);

      visibility('hidden');
      await vi.advanceTimersByTimeAsync(VENDOR_POLL_INTERVAL_MS);
      expect(repo.listOrders).toHaveBeenCalledTimes(2);

      visibility('visible');
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(0);
      expect(repo.listOrders).toHaveBeenCalledTimes(3);
    } finally {
      visibility('visible');
      vi.useRealTimers();
    }
  });
});
