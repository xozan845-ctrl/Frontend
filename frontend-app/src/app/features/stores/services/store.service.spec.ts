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

  it('debe traducir el 409 a un mensaje de negocio (tienda ya existente)', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.createStore({ name: 'X', description: '' }).subscribe({
      error: (err: Error) => (error = err),
    });
    httpMock
      .expectOne('https://api.test/vendedores/tienda')
      .flush({}, { status: 409, statusText: 'Conflict' });

    expect(error?.message).toBe('Ya tienes una tienda creada.');
  });

  it('debe traducir el 403 (rol no vendedor) a un mensaje de negocio', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.createStore({ name: 'X', description: '' }).subscribe({
      error: (err: Error) => (error = err),
    });
    httpMock
      .expectOne('https://api.test/vendedores/tienda')
      .flush({}, { status: 403, statusText: 'Forbidden' });

    expect(error?.message).toBe('Necesitas una cuenta de vendedor para esta acción.');
  });

  it('debe traducir un fallo de red (status 0) a un mensaje de negocio', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.createStore({ name: 'X', description: '' }).subscribe({
      error: (err: Error) => (error = err),
    });
    httpMock
      .expectOne('https://api.test/vendedores/tienda')
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(error?.message).toContain('No pudimos conectar con el servidor');
  });

  it('debe degradar con un error controlado cuando la respuesta no trae id', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.createStore({ name: 'X', description: '' }).subscribe({
      error: (err: Error) => (error = err),
    });
    httpMock.expectOne('https://api.test/vendedores/tienda').flush({ mensaje: 'sin id' });

    expect(error?.message).toBe('No se pudo interpretar la tienda creada.');
  });

  it('debe degradar con el fallback cuando el servidor responde 500', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.publishOffer({ productId: 'p-1', margin: 10 }).subscribe({
      error: (err: Error) => (error = err),
    });
    httpMock
      .expectOne('https://api.test/vendedores/productos')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(error?.message).toBe('No se pudo publicar el producto.');
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

  it('debe obtener mi tienda cuando existe', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service.getMyStore().subscribe((store) => (result = store));
    httpMock.expectOne('https://api.test/vendedores/me/tienda').flush({
      id: 't-1',
      vendedor_id: 'v-1',
      nombre: 'Mi Tienda',
      descripcion: 'Demo',
    });

    expect(result).toEqual({ id: 't-1', vendorId: 'v-1', name: 'Mi Tienda', description: 'Demo' });
  });

  it('debe traducir un error de getMyStore distinto de 404', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.getMyStore().subscribe({ error: (err: Error) => (error = err) });
    httpMock
      .expectOne('https://api.test/vendedores/me/tienda')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(error?.message).toBe('No se pudo cargar tu tienda.');
  });

  it('debe simular la tienda y la oferta en modo mock', async () => {
    environment.apiConfig.dataSource = 'mock';
    build();
    let store: unknown;
    let offer: unknown = 'pendiente';

    service.getMyStore().subscribe((s) => (store = s));
    service.publishOffer({ productId: 'p-1', margin: 10 }).subscribe(() => (offer = 'ok'));
    await vi.waitFor(() => {
      expect(store).toBeDefined();
      expect(offer).toBe('ok');
    });

    httpMock.expectNone(() => true);
  });

  it('debe emitir error en getMyStore y publishOffer cuando no hay apiUrl', () => {
    environment.apiUrl = '';
    build();
    let storeError: Error | undefined;
    let offerError: Error | undefined;

    service.getMyStore().subscribe({ error: (err: Error) => (storeError = err) });
    service.publishOffer({ productId: 'p-1', margin: 10 }).subscribe({
      error: (err: Error) => (offerError = err),
    });

    expect(storeError?.message).toContain('apiUrl no configurado');
    expect(offerError?.message).toContain('apiUrl no configurado');
  });
});
