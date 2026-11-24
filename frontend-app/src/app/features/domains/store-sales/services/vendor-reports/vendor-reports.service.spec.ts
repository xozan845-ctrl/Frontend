import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VendorReportsSource } from './vendor-reports.service';
import { VENDOR_ORDER_REPOSITORY } from '../../repositories/vendor-order.repository';
import type { VendorOrder } from '../../models/vendor-order.model';

const ORDER: VendorOrder = {
  id: 'PED-1',
  clientId: 'c-1',
  clientName: 'Carla',
  createdAt: '2026-10-28T12:00:00.000Z',
  status: 'completado',
  total: 200,
  lines: [],
  notes: '',
};

describe('VendorReportsSource', () => {
  const setup = (orders = () => of<VendorOrder[]>([ORDER])) => {
    TestBed.configureTestingModule({
      providers: [
        VendorReportsSource,
        {
          provide: VENDOR_ORDER_REPOSITORY,
          useValue: {
            listOrders: vi.fn(orders),
            getOrder: vi.fn(),
            createOrder: vi.fn(),
            updateStatus: vi.fn(),
          },
        },
      ],
    });
    return TestBed.inject(VendorReportsSource);
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe cargar los pedidos y calcular el snapshot', async () => {
    const source = setup();

    await source.load();

    expect(source.error()).toBeNull();
    expect(source.lastUpdatedAt()).toBeInstanceOf(Date);
    expect(source.snapshot()).toMatchObject({
      totalSales: 200,
      ordersCount: 1,
      statuses: [{ status: 'completado', total: 200, count: 1 }],
    });
  });

  it('debe exponer la lectura pura con su instante', async () => {
    const source = setup();

    const result = await source.read();

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({ date: '2026-10-28T12:00:00.000Z', total: 200 });
    expect(result.loadedAt).toBeInstanceOf(Date);
  });

  // regression: F12
  it('debe exponer el error sin convertir un fallo en reporte vacío', async () => {
    const source = setup(() => throwError(() => new Error('sin red')));

    await source.load();

    expect(source.error()).toBe('sin red');
    expect(source.lastUpdatedAt()).toBeNull();
    expect(source.snapshot()).toEqual({
      totalSales: 0,
      ordersCount: 0,
      averageTicket: 0,
      days: [],
      statuses: [],
    });
    expect(source.loading()).toBe(false);
  });

  // regression: F12
  it('debe conservar el último dato válido si falla la recarga', async () => {
    let calls = 0;
    const source = setup(() =>
      calls++ === 0 ? of<VendorOrder[]>([ORDER]) : throwError(() => new Error('sin red')),
    );

    await source.load();
    const snapshot = source.snapshot();
    const updatedAt = source.lastUpdatedAt();

    await source.load();

    expect(source.snapshot()).toEqual(snapshot);
    expect(source.lastUpdatedAt()).toBe(updatedAt);
    expect(source.error()).toBe('sin red');
  });

  it('debe usar un mensaje de dominio cuando el error no trae detalle', async () => {
    const source = setup(() => throwError(() => ({})));

    await source.load();

    expect(source.error()).toBe('No se pudieron cargar los reportes de la tienda.');
  });
});
