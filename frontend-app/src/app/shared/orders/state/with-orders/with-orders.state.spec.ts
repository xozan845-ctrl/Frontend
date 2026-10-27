import { InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';
import { of, throwError } from 'rxjs';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import type { OrdersDataSource } from '../../repositories/orders-data-source/orders-data-source.repository';
import { withOrders } from './with-orders.state';

interface TestOrder {
  id: string;
  status: string;
  total: number;
}

type TestStatus = 'nuevo' | 'listo';

const SOURCE = new InjectionToken<OrdersDataSource<TestOrder, TestStatus>>('TestOrdersSource');

const TestOrdersStore = signalStore(withOrders<TestOrder, TestStatus>(SOURCE));

const ORDER: TestOrder = { id: 'PED-1', status: 'nuevo', total: 100 };

describe('withOrders', () => {
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };
  let source: OrdersDataSource<TestOrder, TestStatus>;

  const setup = (dataSource: OrdersDataSource<TestOrder, TestStatus> = source) => {
    TestBed.configureTestingModule({
      providers: [
        TestOrdersStore,
        { provide: SOURCE, useValue: dataSource },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(TestOrdersStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    source = {
      list: vi.fn(() => of([ORDER])),
      detail: vi.fn(() => of(ORDER)),
      updateStatus: vi.fn(() => of({ ...ORDER, status: 'listo' })),
    };
  });

  it('debe cargar la lista y marcar la última actualización', async () => {
    const store = setup();

    store.loadOrders();
    await vi.waitFor(() => expect(store.orderRecords()).toHaveLength(1));

    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.lastUpdatedAt()).not.toBeNull();
    expect(source.list).toHaveBeenCalledTimes(1);
  });

  it('debe exponer el error del listado con aviso y mensaje por defecto', async () => {
    vi.mocked(source.list).mockReturnValue(throwError(() => new Error('boom')));
    const store = setup();

    store.loadOrders();
    await vi.waitFor(() => expect(store.error()).toBe('boom'));

    expect(store.loading()).toBe(false);
    expect(notification.showError).toHaveBeenCalledWith('boom');

    vi.mocked(source.list).mockReturnValue(throwError(() => new Error('')));
    store.loadOrders();
    await vi.waitFor(() => expect(store.error()).toBe('No se pudieron cargar los pedidos.'));
  });

  it('refresh conserva la lista y no notifica cuando falla', async () => {
    const store = setup();
    store.loadOrders();
    await vi.waitFor(() => expect(store.orderRecords()).toHaveLength(1));
    notification.showError.mockClear();

    vi.mocked(source.list).mockReturnValue(throwError(() => new Error('sin red')));
    store.refresh();
    await vi.waitFor(() => expect(store.error()).toBe('sin red'));

    expect(store.orderRecords()).toHaveLength(1);
    expect(notification.showError).not.toHaveBeenCalled();
  });

  it('debe cargar el detalle y reflejarlo en la lista', async () => {
    const store = setup();
    store.loadOrders();
    await vi.waitFor(() => expect(store.orderRecords()).toHaveLength(1));

    const detailed: TestOrder = { ...ORDER, total: 250 };
    vi.mocked(source.detail!).mockReturnValue(of(detailed));
    store.loadOrder('PED-1');
    await vi.waitFor(() => expect(store.selectedRecord()).toEqual(detailed));

    expect(store.selectedLoading()).toBe(false);
    expect(store.orderRecords()[0].total).toBe(250);
  });

  it('debe exponer el error del detalle con aviso y mensaje por defecto', async () => {
    vi.mocked(source.detail!).mockReturnValue(throwError(() => new Error('sin conexión')));
    const store = setup();

    store.loadOrder('PED-404');
    await vi.waitFor(() => expect(store.selectedError()).toBe('sin conexión'));

    expect(store.selectedLoading()).toBe(false);
    expect(notification.showError).toHaveBeenCalledWith('sin conexión');

    vi.mocked(source.detail!).mockReturnValue(throwError(() => new Error('')));
    store.loadOrder('PED-404');
    await vi.waitFor(() => expect(store.selectedError()).toBe('No se pudo cargar el pedido.'));
  });

  it('debe cambiar el estado del pedido abierto y actualizar la lista', async () => {
    const store = setup();
    store.loadOrders();
    await vi.waitFor(() => expect(store.orderRecords()).toHaveLength(1));
    store.loadOrder('PED-1');
    await vi.waitFor(() => expect(store.selectedRecord()).not.toBeNull());

    store.updateStatus('listo');
    await vi.waitFor(() => expect(store.selectedRecord()?.status).toBe('listo'));

    expect(source.updateStatus).toHaveBeenCalledWith('PED-1', 'listo');
    expect(store.orderRecords()[0].status).toBe('listo');
    expect(store.updatingStatus()).toBe(false);
    expect(notification.showSuccess).toHaveBeenCalledWith('Pedido PED-1 actualizado.');
  });

  it('debe conservar el estado y avisar cuando falla el cambio', async () => {
    vi.mocked(source.updateStatus!).mockReturnValue(throwError(() => new Error('conflicto')));
    const store = setup();
    store.loadOrder('PED-1');
    await vi.waitFor(() => expect(store.selectedRecord()).not.toBeNull());
    notification.showError.mockClear();

    store.updateStatus('listo');
    await vi.waitFor(() => expect(store.selectedError()).toBe('conflicto'));

    expect(store.selectedRecord()?.status).toBe('nuevo');
    expect(store.updatingStatus()).toBe(false);
    expect(notification.showError).toHaveBeenCalledWith('conflicto');

    vi.mocked(source.updateStatus!).mockReturnValue(throwError(() => new Error('')));
    store.updateStatus('listo');
    await vi.waitFor(() =>
      expect(store.selectedError()).toBe('No se pudo actualizar el estado del pedido.'),
    );
  });

  it('no debe llamar al backend sin pedido seleccionado', async () => {
    const store = setup();

    store.updateStatus('listo');
    await Promise.resolve();

    expect(source.updateStatus).not.toHaveBeenCalled();
    expect(store.updatingStatus()).toBe(false);
  });

  it('debe ignorar detalle y cambio de estado en una fuente de solo lectura', async () => {
    const readOnly: OrdersDataSource<TestOrder, TestStatus> = { list: vi.fn(() => of([ORDER])) };
    const store = setup(readOnly);

    store.loadOrder('PED-1');
    store.updateStatus('listo');
    await vi.waitFor(() => expect(store.selectedLoading()).toBe(false));

    expect(store.selectedError()).toBeNull();
    expect(store.updatingStatus()).toBe(false);
    expect(notification.showError).not.toHaveBeenCalled();
  });

  it('debe limpiar el detalle y sus indicadores', async () => {
    const store = setup();
    store.loadOrder('PED-1');
    await vi.waitFor(() => expect(store.selectedRecord()).not.toBeNull());

    store.clearSelectedOrder();

    expect(store.selectedRecord()).toBeNull();
    expect(store.selectedLoading()).toBe(false);
    expect(store.selectedError()).toBeNull();
    expect(store.updatingStatus()).toBe(false);
  });
});
