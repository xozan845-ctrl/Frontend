import { adaptCompanySalesAccountFromBackend } from './company-sales.adapter';
import { COMPANY_SALES_FIXTURE } from '../fixtures/company-portal.fixture';

// R-C-8: contrato contra la respuesta versionada de `empresarios/me/ventas`.
describe('company-sales.contract', () => {
  it('normaliza el estado de cuenta de empresa y sus importes', () => {
    const account = adaptCompanySalesAccountFromBackend(COMPANY_SALES_FIXTURE);

    expect(account).toMatchObject({
      companyId: 'empresa-1',
      pendingCommissions: 138,
      sales: [
        {
          orderId: 'o-1',
          sale: 2300,
          commission: 276,
          companyAmount: 2024,
          status: 'acreditada',
          date: '2026-10-22T15:00:00.000Z',
        },
      ],
    });
  });
});
