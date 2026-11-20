import type { OrderResponse } from '@domains/orders/public-api';
import { buildReportSnapshot } from '@domains/reports/public-api';
import { toCompanyReportEntry } from './company-reports.functions';

const order = (status: string, total = 100): OrderResponse => ({
  id: 'o-1',
  orderNumber: 'ORD-1',
  status,
  total,
  createdAt: '2026-11-19T10:00:00.000Z',
});

describe('toCompanyReportEntry', () => {
  it('debe traducir una entrega a una entrada de venta reconocida', () => {
    expect(toCompanyReportEntry(order('entregada'))).toEqual({
      date: '2026-11-19T10:00:00.000Z',
      total: 100,
      status: 'delivered',
    });
  });

  it('debe traducir una cancelación y una devolución a estados separados', () => {
    expect(toCompanyReportEntry(order('cancelada', 200)).status).toBe('cancelled');
    expect(toCompanyReportEntry(order('devuelta', 300)).status).toBe('returned');
  });

  it('debe marcar como desconocido un estado que no pertenece a la política', () => {
    expect(toCompanyReportEntry(order('en revisión')).status).toBe('unknown');
  });

  it('debe producir ventas, cancelaciones y devoluciones separadas bajo la misma política', () => {
    const snapshot = buildReportSnapshot(
      [order('entregada', 100), order('cancelada', 200), order('devuelta', 300)].map(
        toCompanyReportEntry,
      ),
    );

    expect(snapshot).toMatchObject({
      recognizedSales: 100,
      cancellations: 200,
      returns: 300,
      ordersCount: 3,
    });
  });
});
