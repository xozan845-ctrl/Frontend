import { adaptCompanySalesAccountFromBackend } from './company-sales.adapter';
import { COMPANY_SALES_FIXTURE } from '../fixtures/company-portal.fixture';

describe('company-sales.adapter', () => {
  it('debe normalizar ventas y comisiones pendientes', () => {
    const account = adaptCompanySalesAccountFromBackend(COMPANY_SALES_FIXTURE);

    expect(account.companyId).toBe('empresa-1');
    expect(account.pendingCommissions).toBe(138);
    expect(account.sales).toHaveLength(1);
    expect(account.sales[0]).toMatchObject({
      orderId: 'o-1',
      sale: 2300,
      commission: 276,
      companyAmount: 2024,
      status: 'acreditada',
    });
  });

  it('debe descartar ventas sin id y tolerar montos ausentes', () => {
    const account = adaptCompanySalesAccountFromBackend({
      empresa_id: 'e-1',
      ventas: [{ order_id: null }, { order_id: 'o-2' }],
      comisiones_pendientes: null,
    });

    expect(account.sales).toHaveLength(1);
    expect(account.sales[0]).toMatchObject({
      orderId: 'o-2',
      sale: 0,
      commission: 0,
      companyAmount: 0,
      status: 'acreditada',
    });
    expect(account.pendingCommissions).toBe(0);
  });

  it('debe tolerar camelCase y respuestas incompletas', () => {
    expect(
      adaptCompanySalesAccountFromBackend({
        empresaId: 'e-2',
        ventas: [{ orderId: 'o-2', venta: '10.50', comision: '1.20', montoEmpresario: '9.30' }],
        comisionesPendientes: '0.50',
      }),
    ).toMatchObject({ companyId: 'e-2', pendingCommissions: 0.5 });
    expect(adaptCompanySalesAccountFromBackend(null)).toEqual({
      companyId: '',
      sales: [],
      pendingCommissions: 0,
    });
  });
});
