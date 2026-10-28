import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CompanyReportsSource } from './company-reports.service';
import { COMPANY_PORTAL_REPOSITORY } from '../../repositories/company-portal.repository';
import type { OrderResponse } from '../../../cart/public-api';

const ORDER: OrderResponse = {
  id: 'o-1',
  orderNumber: 'ORD-1',
  status: 'pagada',
  total: 300,
  createdAt: '2026-10-28T12:00:00.000Z',
};

describe('CompanyReportsSource', () => {
  const setup = (orders = of<OrderResponse[]>([ORDER])) => {
    TestBed.configureTestingModule({
      providers: [
        CompanyReportsSource,
        {
          provide: COMPANY_PORTAL_REPOSITORY,
          useValue: { orders: vi.fn(() => orders), sales: vi.fn(), stores: vi.fn() },
        },
      ],
    });
    return TestBed.inject(CompanyReportsSource);
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe cargar las órdenes y calcular el snapshot', async () => {
    const source = setup();

    await source.load();

    expect(source.loading()).toBe(false);
    expect(source.snapshot()).toMatchObject({
      totalSales: 300,
      ordersCount: 1,
      averageTicket: 300,
    });
    expect(source.snapshot().days[0]).toMatchObject({ date: '2026-10-28', count: 1 });
  });

  it('debe dejar el reporte vacío si falla la carga', async () => {
    const source = setup(throwError(() => new Error('sin red')));

    await source.load();

    expect(source.snapshot()).toMatchObject({ totalSales: 0, ordersCount: 0 });
    expect(source.loading()).toBe(false);
  });
});
