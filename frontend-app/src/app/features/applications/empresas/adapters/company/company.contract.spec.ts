import { adaptCompanyFromBackend, adaptCompanySellerFromBackend } from './company.adapter';
import { COMPANY_FIXTURE, COMPANY_SELLER_FIXTURE } from '../fixtures/company.fixture';

// R-C-8: contrato contra fixture versionado del backend, no contra el servicio en vivo.
describe('company.contract', () => {
  it('debe normalizar EmpresaResponseDto al modelo de dominio', () => {
    expect(adaptCompanyFromBackend(COMPANY_FIXTURE)).toEqual({
      id: 'dfe0cfe4-8ddc-42bf-8dd2-6c3cb43544b3',
      name: 'Empresa Prueba',
      logisticsMode: 'hibrida',
      status: 'activa',
      createdBy: 'e9aa395b-1654-48b0-befe-fbe38538a408',
      createdAt: '2026-10-21T19:43:28.137Z',
    });
  });

  it('debe normalizar VendedorEmpresaResponseDto al modelo de dominio', () => {
    expect(adaptCompanySellerFromBackend(COMPANY_SELLER_FIXTURE)).toEqual({
      id: '01b18556-d3f0-4ec1-a5b8-58cfa8f98e84',
      name: 'Vendedor Prueba',
      email: 'vendedor@tienda.test',
      role: 'vendedor',
      participationPercentage: 25,
    });
  });

  it('debe tolerar el envelope { data } heredado (R-AR-4)', () => {
    expect(adaptCompanyFromBackend({ data: COMPANY_FIXTURE })?.id).toBe(COMPANY_FIXTURE.id);
  });
});
