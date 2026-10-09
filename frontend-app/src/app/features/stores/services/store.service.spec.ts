import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StoreService } from './store.service';
import { environment } from '../../../../environments/environment';

describe('StoreService', () => {
  let service: StoreService;
  let httpMock: HttpTestingController;

  const originalApiUrl = environment.apiUrl;
  const originalDataSource = environment.apiConfig.dataSource;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StoreService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
    environment.apiConfig.dataSource = originalDataSource;
  });

  it('debe crear la tienda (POST /vendedores/tienda)', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service
      .createStore({ name: 'Mi Tienda', description: 'Demo' })
      .subscribe((store) => (result = store));

    const request = httpMock.expectOne('https://api.test/vendedores/tienda');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ nombre: 'Mi Tienda', descripcion: 'Demo' });
    request.flush({ id: 't-1', vendedor_id: 'v-1', nombre: 'Mi Tienda', descripcion: 'Demo' });

    expect(result).toEqual({ id: 't-1', vendorId: 'v-1', name: 'Mi Tienda', description: 'Demo' });
  });

  it('debe obtener mi tienda y devolver null ante 404', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown = 'sin-definir';

    service.getMyStore().subscribe((store) => (result = store));

    httpMock
      .expectOne('https://api.test/vendedores/me/tienda')
      .flush({ mensaje: 'no encontrada' }, { status: 404, statusText: 'Not Found' });

    expect(result).toBeNull();
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

  it('debe publicar una oferta (POST /vendedores/productos)', () => {
    environment.apiUrl = 'https://api.test';
    build();

    service.publishOffer({ productId: 'p-1', margin: 20 }).subscribe();
    const request = httpMock.expectOne('https://api.test/vendedores/productos');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ producto_id: 'p-1', margen: 20 });
    request.flush({ id: 'of-1' });
  });

  it('debe simular la creación en modo mock', async () => {
    environment.apiConfig.dataSource = 'mock';
    build();

    let store: unknown;
    service.createStore({ name: 'X', description: '' }).subscribe((s) => (store = s));
    await vi.waitFor(() => expect(store).toBeDefined());

    httpMock.expectNone(() => true);
  });

  it('debe emitir un error cuando no hay apiUrl configurada', () => {
    environment.apiUrl = '';
    build();
    let error: Error | undefined;

    service.createStore({ name: 'X', description: '' }).subscribe({
      error: (err: Error) => (error = err),
    });

    expect(error?.message).toContain('apiUrl no configurado');
  });
});
