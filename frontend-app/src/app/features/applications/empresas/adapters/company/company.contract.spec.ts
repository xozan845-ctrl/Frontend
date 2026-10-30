import { adaptCompanyFromBackend, adaptCompanySellerFromBackend } from './company.adapter';
import { COMPANY_FIXTURE, COMPANY_SELLER_FIXTURE } from '../fixtures/company.fixture';

// R-C-8: contrato contra fixture versionado del backend, no contra el servicio en vivo.
describe('company.contract', () => {
  it('debe normalizar EmpresaResponseDto al modelo de dominio', () => {
    expect(adaptCompanyFromBackend(COMPANY_FIXTURE)).toEqual({
      id: 'dfe0cfe4-8ddc-42bf-8dd2-6c3cb43544b3',
      name: 'Empresa Prueba',
      slug: 'empresa-prueba',
      logisticsMode: 'hibrida',
      type: 'comercial',
      status: 'activa',
      createdBy: 'e9aa395b-1654-48b0-befe-fbe38538a408',
      createdAt: '2026-10-21T19:43:28.137Z',
      taxId: 'J0310000000000',
      legalName: 'Empresa Prueba S.A.',
      commercialName: 'Prueba Store',
      description: 'Tienda de prueba del contrato.',
      phone: '+505 8888 0000',
      contactEmail: 'hola@empresa.test',
      website: 'https://empresa.test',
      address: 'Calle 1, Managua',
      city: 'Managua',
      department: 'Managua',
      country: 'Nicaragua',
      currency: 'NIO',
      timezone: 'America/Managua',
      sector: 'Comercio',
      legalRepresentative: 'Ana Pérez',
      businessHours: 'Lun–Vie 8:00–18:00',
      logoObjectId: '3f1c0a8e-7d2b-4c6a-9f10-2b8d5e4a7c01',
      logoUrl: 'https://cdn.empresa.test/logo.png',
      updatedAt: '2026-10-22T10:00:00.000Z',
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
