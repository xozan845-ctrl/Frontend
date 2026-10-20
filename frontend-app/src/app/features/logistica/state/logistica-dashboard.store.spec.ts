import { TestBed } from '@angular/core/testing';
import { ALL_ZONES } from '../constants/logistica.constants';
import { LogisticaDashboardStore } from './logistica-dashboard.store';

describe('LogisticaDashboardStore', () => {
  const setup = (): InstanceType<typeof LogisticaDashboardStore> => {
    TestBed.configureTestingModule({ providers: [LogisticaDashboardStore] });
    return TestBed.inject(LogisticaDashboardStore);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe marcar carga y publicar el tablero cuando termina la latencia simulada', () => {
    const store = setup();

    store.load();
    expect(store.loading()).toBe(true);
    expect(store.kpis()).toHaveLength(0);

    vi.advanceTimersByTime(500);

    expect(store.loading()).toBe(false);
    expect(store.kpis()).toHaveLength(4);
    expect(store.orders()).toHaveLength(5);
    expect(store.clients()).toHaveLength(5);
    expect(store.routes()).toHaveLength(4);
    expect(store.vehicles()).toHaveLength(3);
  });

  it('debe filtrar pedidos y clientes por la zona elegida (R-ST-3)', () => {
    const store = setup();
    store.load();
    vi.advanceTimersByTime(500);

    store.setZoneFilter('Centro');

    expect(store.filteredOrders()).toHaveLength(2);
    expect(store.filteredOrders().every((order) => order.zone === 'Centro')).toBe(true);
    expect(store.filteredClients()).toHaveLength(2);
    expect(store.hasZoneFilter()).toBe(true);

    store.setZoneFilter(ALL_ZONES);

    expect(store.filteredOrders()).toHaveLength(5);
    expect(store.filteredClients()).toHaveLength(5);
    expect(store.hasZoneFilter()).toBe(false);
  });

  it('debe derivar los repartidores activos y el total programado del día', () => {
    const store = setup();
    store.load();
    vi.advanceTimersByTime(500);

    expect(store.deliveryTotal()).toBe(42);
    expect(store.activeCouriers()).toBe(3);
  });

  it('debe cambiar la jornada sin alterar los datos cargados', () => {
    const store = setup();
    store.load();
    vi.advanceTimersByTime(500);

    store.setDateLabel('Mañana, 20 de octubre de 2026');

    expect(store.dateLabel()).toBe('Mañana, 20 de octubre de 2026');
    expect(store.orders()).toHaveLength(5);
  });
});
