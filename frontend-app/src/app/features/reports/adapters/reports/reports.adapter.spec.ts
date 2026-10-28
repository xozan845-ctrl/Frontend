import { buildReportSnapshot } from './reports.adapter';

describe('reports.adapter', () => {
  it('debe devolver un snapshot vacío sin ventas', () => {
    expect(buildReportSnapshot([])).toEqual({
      totalSales: 0,
      ordersCount: 0,
      averageTicket: 0,
      days: [],
      statuses: [],
    });
  });

  it('debe agrupar por día y estado, ordenar y calcular el promedio', () => {
    const snapshot = buildReportSnapshot([
      { date: '2026-10-27T12:00:00.000Z', total: 100, status: 'pagada' },
      { date: '2026-10-27T18:00:00.000Z', total: 200, status: 'pagada' },
      { date: '2026-10-28T09:00:00.000Z', total: 50, status: 'pendiente' },
      { date: '', total: 25, status: '' },
    ]);

    expect(snapshot).toMatchObject({
      totalSales: 375,
      ordersCount: 4,
      averageTicket: 93.75,
    });
    expect(snapshot.days).toEqual([
      { date: '2026-10-28', total: 50, count: 1 },
      { date: '2026-10-27', total: 300, count: 2 },
    ]);
    expect(snapshot.statuses).toEqual([
      { status: 'pagada', total: 300, count: 2 },
      { status: 'pendiente', total: 50, count: 1 },
      { status: 'sin_estado', total: 25, count: 1 },
    ]);
  });

  it('debe redondear importes de días y estados', () => {
    const snapshot = buildReportSnapshot([{ date: '2026-10-27', total: 10.005, status: 'pagada' }]);

    expect(snapshot.totalSales).toBe(10.01);
    expect(snapshot.days[0].total).toBe(10.01);
    expect(snapshot.statuses[0].total).toBe(10.01);
  });
});
