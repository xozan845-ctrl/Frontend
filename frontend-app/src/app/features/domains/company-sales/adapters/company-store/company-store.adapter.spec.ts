import {
  adaptCompanyStoreFromBackend,
  adaptCompanyStoresFromBackend,
} from './company-store.adapter';
import { COMPANY_STORES_FIXTURE } from '../fixtures/company-portal.fixture';

describe('company-store.adapter', () => {
  it('debe normalizar una tienda de la empresa', () => {
    expect(adaptCompanyStoreFromBackend(COMPANY_STORES_FIXTURE[0])).toEqual({
      id: 'tienda-1',
      companyId: 'empresa-1',
      ownerUserId: 'user-1',
      sellerId: 'vendedor-1',
      name: 'Tienda Centro',
      description: 'Sucursal central',
      participationPercentage: 100,
      createdAt: '2026-10-21T10:00:00.000Z',
    });
  });

  it('debe tolerar campos ausentes y participación inválida', () => {
    expect(
      adaptCompanyStoreFromBackend({
        id: 'tienda-4',
        empresa_id: null,
        vendedor_id: null,
        nombre: null,
        participacion_porcentaje: 'no-numero',
      }),
    ).toMatchObject({
      id: 'tienda-4',
      companyId: '',
      sellerId: '',
      name: 'Tienda',
      participationPercentage: 0,
    });
  });

  it('debe tolerar camelCase, envelopes y descartar sin id', () => {
    expect(
      adaptCompanyStoreFromBackend({
        id: 'tienda-3',
        empresaId: 'e',
        vendedorId: 'v',
        nombre: 'Norte',
        participacionPorcentaje: 150,
      }),
    ).toMatchObject({ id: 'tienda-3', participationPercentage: 100 });
    expect(adaptCompanyStoresFromBackend({ data: COMPANY_STORES_FIXTURE })).toHaveLength(2);
    expect(adaptCompanyStoresFromBackend([{ nombre: 'sin id' }])).toEqual([]);
    expect(adaptCompanyStoresFromBackend(null)).toEqual([]);
  });
});
