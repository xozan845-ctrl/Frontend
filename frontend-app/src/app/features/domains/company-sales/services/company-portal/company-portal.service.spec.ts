import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CompanyPortalService } from './company-portal.service';
import { environment } from '../../../../../../environments/environment';
import {
  COMPANY_SALES_FIXTURE,
  COMPANY_STORES_FIXTURE,
} from '../../adapters/fixtures/company-portal.fixture';

describe('CompanyPortalService', () => {
  let service: CompanyPortalService;
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CompanyPortalService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
  });

  it('debe listar órdenes con filtros de tienda, estado y límite', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service.orders({ storeId: 'tienda-1', status: 'pagada', limit: 10 }).subscribe((orders) => {
      result = orders;
    });

    const request = httpMock.expectOne((req) => req.url === 'https://api.test/orders/empresa');
    expect(request.request.params.get('tiendaId')).toBe('tienda-1');
    expect(request.request.params.get('estado')).toBe('pagada');
    expect(request.request.params.get('limite')).toBe('10');
    request.flush([
      {
        id: 'o-1',
        estado: 'pagada',
        total_cents: 230000,
        tienda_id: 'tienda-1',
        creado_en: '2026-10-22T15:00:00.000Z',
      },
    ]);

    expect(result).toHaveLength(1);
  });

  it('debe cargar ventas y tiendas de la empresa', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let sales: unknown;
    let stores: unknown;

    service.sales().subscribe((value) => (sales = value));
    service.stores().subscribe((value) => (stores = value));

    httpMock.expectOne('https://api.test/empresarios/me/ventas').flush(COMPANY_SALES_FIXTURE);
    httpMock.expectOne('https://api.test/empresarios/me/tiendas').flush(COMPANY_STORES_FIXTURE);

    expect(sales).toMatchObject({ companyId: 'empresa-1' });
    expect(stores).toHaveLength(2);
  });

  it('debe traducir errores y fallar sin apiUrl', () => {
    environment.apiUrl = 'https://api.test';
    build();
    const errors: Error[] = [];

    service.orders().subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne((req) => req.url === 'https://api.test/orders/empresa')
      .flush({ mensaje: 'Sin empresa.' }, { status: 400, statusText: 'Bad Request' });

    service.sales().subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/empresarios/me/ventas')
      .flush({}, { status: 500, statusText: 'Server Error' });

    service.stores().subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/empresarios/me/tiendas')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(errors[0].message).toBe('Sin empresa.');
    expect(errors[1].message).toBe('No se pudo cargar el estado de cuenta.');
    expect(errors[2].message).toBe('No se pudieron cargar las tiendas.');

    environment.apiUrl = '';
    const missing: Error[] = [];
    service.orders().subscribe({ error: (e: Error) => missing.push(e) });
    service.stores().subscribe({ error: (e: Error) => missing.push(e) });
    expect(missing).toHaveLength(2);
    missing.forEach((error) => expect(error.message).toContain('apiUrl no configurado'));
  });
});
