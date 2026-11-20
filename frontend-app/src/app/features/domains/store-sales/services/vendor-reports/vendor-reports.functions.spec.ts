import { buildReportSnapshot } from '@domains/reports/public-api';
import type { VendorOrder } from '../../models/vendor-order.model';
import { toVendorReportEntry } from './vendor-reports.functions';

const order = (status: VendorOrder['status'], total = 100): VendorOrder => ({
  id: 'PED-1',
  clientId: 'c-1',
  clientName: 'Carla',
  createdAt: '2026-11-19T10:00:00.000Z',
  status,
  total,
  lines: [],
  notes: '',
});

describe('toVendorReportEntry', () => {
  it('debe traducir un pedido completado a venta reconocida', () => {
    expect(toVendorReportEntry(order('completado'))).toEqual({
      date: '2026-11-19T10:00:00.000Z',
      total: 100,
      status: 'delivered',
    });
  });

  it('debe separar la cancelación de las ventas reconocidas', () => {
    expect(toVendorReportEntry(order('cancelado', 200)).status).toBe('cancelled');
  });

  it('debe tratar pendiente y en proceso como no reconocidos', () => {
    expect(toVendorReportEntry(order('pendiente')).status).toBe('pending');
    expect(toVendorReportEntry(order('en_proceso')).status).toBe('pending');
  });

  it('debe producir ventas y cancelaciones separadas bajo la misma política', () => {
    const snapshot = buildReportSnapshot(
      [order('completado', 100), order('cancelado', 200)].map(toVendorReportEntry),
    );

    expect(snapshot).toMatchObject({
      ordersCount: 2,
      recognizedSales: 100,
      cancellations: 200,
      returns: 0,
      netSales: 100,
    });
  });
});
