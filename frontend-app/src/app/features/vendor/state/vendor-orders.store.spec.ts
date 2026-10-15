import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VendorOrdersStore } from './vendor-orders.store';
import {
  VENDOR_ORDER_REPOSITORY,
  VendorOrderRepository,
} from '../repositories/vendor-order.repository';
import { NotificationService } from '../../../core/services/notification.service';
import { VENDOR_POLL_INTERVAL_MS } from '../constants/vendor.constants';
import { VendorOrder } from '../models/vendor-order.model';

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
