import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CatalogService } from './catalog.service';
import { environment } from '../../../../environments/environment';

describe('CatalogService', () => {
  let service: CatalogService;
  let httpMock: HttpTestingController;

  const originalApiUrl = environment.apiUrl;
  const originalDataSource = environment.apiConfig.dataSource;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
    environment.apiConfig.dataSource = originalDataSource;
  });

  it('debe listar el catálogo (GET /catalog/productos)', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown[] | undefined;

    service.listCatalog().subscribe((options) => (result = options));
    httpMock
      .expectOne('https://api.test/catalog/productos')
      .flush({ items: [{ id: 'p-1', nombre: 'Teclado', sku: 'SKU-1' }] });

    expect(result).toEqual([{ id: 'p-1', name: 'Teclado', sku: 'SKU-1' }]);
  });

  it('debe simular el catálogo en modo mock', async () => {
    environment.apiConfig.dataSource = 'mock';
    build();

    let options: unknown[] | undefined;
    service.listCatalog().subscribe((catalog) => (options = catalog));
    await vi.waitFor(() => expect(options).toBeDefined());

    httpMock.expectNone(() => true);
  });

  it('debe traducir un fallo de red (status 0) a un mensaje de negocio', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.listCatalog().subscribe({ error: (err: Error) => (error = err) });
    httpMock
      .expectOne('https://api.test/catalog/productos')
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(error?.message).toContain('No pudimos conectar con el servidor');
  });

  it('debe emitir un error cuando no hay apiUrl configurada', () => {
    environment.apiUrl = '';
    build();
    let error: Error | undefined;

    service.listCatalog().subscribe({ error: (err: Error) => (error = err) });

    expect(error?.message).toContain('apiUrl no configurado');
  });
});
