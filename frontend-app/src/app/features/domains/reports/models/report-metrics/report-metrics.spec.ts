import type { ReportEntry } from '../report.model';
import { buildReportSnapshot } from './report-metrics';

describe('buildReportSnapshot', () => {
  it('debe devolver un snapshot vacío sin pedidos', () => {
    expect(buildReportSnapshot([])).toEqual({
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
  });

  // regression: F11
  it('debe separar ventas reconocidas, cancelaciones y devoluciones', () => {
    const snapshot = buildReportSnapshot([
      { date: '2026-11-19T10:00:00.000Z', total: 100, status: 'delivered' },
      { date: '2026-11-19T11:00:00.000Z', total: 200, status: 'cancelled' },
      { date: '2026-11-19T12:00:00.000Z', total: 300, status: 'returned' },
    ]);

    expect(snapshot).toMatchObject({
      ordersCount: 3,
      recognizedSales: 100,
      recognizedOrders: 1,
      collections: 0,
      cancellations: 200,
      cancelledOrders: 1,
      returns: 300,
      returnedOrders: 1,
      netSales: -200,
      averageTicket: 100,
    });
    expect(snapshot.days).toEqual([{ date: '2026-11-19', total: 100, count: 1 }]);
    expect(snapshot.statuses).toEqual([
      { status: 'cancelled', total: 200, count: 1 },
      { status: 'delivered', total: 100, count: 1 },
      { status: 'returned', total: 300, count: 1 },
    ]);
  });

  it('debe reconocer ventas pagadas y contarlas como cobro', () => {
    const snapshot = buildReportSnapshot([{ date: '2026-11-19', total: 150, status: 'paid' }]);

    expect(snapshot.recognizedSales).toBe(150);
    expect(snapshot.recognizedOrders).toBe(1);
    expect(snapshot.collections).toBe(150);
    expect(snapshot.netSales).toBe(150);
  });

  it('no debe contar pendientes ni estados desconocidos como venta', () => {
    const snapshot = buildReportSnapshot([
      { date: '2026-11-19', total: 80, status: 'pending' },
      { date: '2026-11-19', total: 90, status: 'unknown' },
    ]);

    expect(snapshot).toMatchObject({
      ordersCount: 2,
      recognizedSales: 0,
      recognizedOrders: 0,
      collections: 0,
      cancellations: 0,
      returns: 0,
      netSales: 0,
      averageTicket: 0,
      days: [],
    });
    expect(snapshot.statuses).toEqual([
      { status: 'pending', total: 80, count: 1 },
      { status: 'unknown', total: 90, count: 1 },
    ]);
  });

  it('debe agrupar ventas reconocidas por día y ordenar de más reciente a más antiguo', () => {
    const snapshot = buildReportSnapshot([
      { date: '2026-11-18T12:00:00.000Z', total: 40, status: 'delivered' },
      { date: '2026-11-19T12:00:00.000Z', total: 60, status: 'paid' },
      { date: '2026-11-19T18:00:00.000Z', total: 100, status: 'delivered' },
    ]);

    expect(snapshot.days).toEqual([
      { date: '2026-11-19', total: 160, count: 2 },
      { date: '2026-11-18', total: 40, count: 1 },
    ]);
  });

  it('debe redondear importes de ventas, devoluciones y neto', () => {
    const snapshot = buildReportSnapshot([
      { date: '2026-11-19', total: 10.005, status: 'delivered' },
      { date: '2026-11-19', total: 0.005, status: 'returned' },
    ]);

    expect(snapshot.recognizedSales).toBe(10.01);
    expect(snapshot.returns).toBe(0.01);
    expect(snapshot.netSales).toBe(10);
    expect(snapshot.days[0].total).toBe(10.01);
  });

  it('debe ignorar fechas vacías y montos no finitos sin romper la agrupación', () => {
    const snapshot = buildReportSnapshot([
      { date: '', total: 50, status: 'delivered' },
      { date: '2026-11-19', total: Number.NaN, status: 'paid' },
      { date: '2026-11-19', total: Number.POSITIVE_INFINITY, status: 'delivered' },
    ]);

    expect(snapshot.recognizedSales).toBe(50);
    expect(snapshot.recognizedOrders).toBe(3);
    expect(snapshot.days).toEqual([{ date: '2026-11-19', total: 0, count: 2 }]);
  });

  it('debe producir la misma métrica con entradas equivalentes de empresa y vendedor', () => {
    const companyEntries: ReportEntry[] = [{ date: '2026-11-19', total: 100, status: 'delivered' }];
    const vendorEntries: ReportEntry[] = [{ date: '2026-11-19', total: 100, status: 'delivered' }];

    expect(buildReportSnapshot(vendorEntries)).toEqual(buildReportSnapshot(companyEntries));
  });
});
