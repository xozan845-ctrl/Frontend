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
  const setup = (orders = of<VendorOrder[]>([ORDER])) => {
    TestBed.configureTestingModule({
      providers: [
        VendorReportsSource,
        {
          provide: VENDOR_ORDER_REPOSITORY,
          useValue: {
            listOrders: vi.fn(() => orders),
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

    expect(source.snapshot()).toMatchObject({
      recognizedSales: 200,
      recognizedOrders: 1,
      ordersCount: 1,
      averageTicket: 200,
      statuses: [{ status: 'delivered', total: 200, count: 1 }],
    });
  });

  // regression: F11
  it('debe separar las cancelaciones de las ventas reconocidas', async () => {
    const source = setup(
      of<VendorOrder[]>([
        { ...ORDER, status: 'completado', total: 100 },
        { ...ORDER, status: 'cancelado', total: 200 },
      ]),
    );

    await source.load();

    expect(source.snapshot()).toMatchObject({
      ordersCount: 2,
      recognizedSales: 100,
      cancellations: 200,
      returns: 0,
      netSales: 100,
    });
  });

  it('debe dejar el reporte vacío si falla la carga', async () => {
    const source = setup(throwError(() => new Error('sin red')));

    await source.load();

    expect(source.snapshot()).toEqual({
      ordersCount: 0,
      recognizedSales: 0,
      recognizedOrders: 0,
      collections: 0,
      cancellations: 0,
      cancelledOrders: 0,
      returns: 0,
      returnedOrders: 0,
      netSales: 0,
      averageTicket: 0,
      days: [],
      statuses: [],
    });
    expect(source.loading()).toBe(false);
  });
});
