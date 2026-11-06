import { adaptCompanyStoresFromBackend } from './company-store.adapter';
import { COMPANY_STORES_FIXTURE } from '../fixtures/company-portal.fixture';

// R-C-8: contrato contra `TiendaResponseDto` versionado.
describe('company-store.contract', () => {
  it('normaliza la lista de tiendas del tenant', () => {
    const stores = adaptCompanyStoresFromBackend({ data: COMPANY_STORES_FIXTURE });

    expect(stores).toHaveLength(2);
    expect(stores[0]).toMatchObject({
      id: 'tienda-1',
      companyId: 'empresa-1',
      ownerUserId: 'user-1',
      sellerId: 'vendedor-1',
      participationPercentage: 100,
      createdAt: '2026-10-21T10:00:00.000Z',
    });
  });
});
