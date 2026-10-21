import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VendorProductService } from './vendor-product.service';
import { environment } from '../../../../../environments/environment';

describe('VendorProductService', () => {
  let service: VendorProductService;
  let httpMock: HttpTestingController;

  const originalApiUrl = environment.apiUrl;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VendorProductService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    environment.apiUrl = 'https://api.test';
  });

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
  });

  it('debe listar el catálogo del vendedor normalizado (GET /vendedores/me/productos)', () => {
    build();
    let products: unknown;

    service.listVendorProducts().subscribe((result) => (products = result));

    const request = httpMock.expectOne('https://api.test/vendedores/me/productos');
    expect(request.request.method).toBe('GET');
    request.flush({
      data: [{ id: 7, nombre: 'Camelia Oil', categoria: 'Tratamientos', precio: '195.00' }],
    });

    expect(products).toEqual([
      {
        id: '7',
        name: 'Camelia Oil',
        sku: '',
        category: 'Tratamientos',
        price: 195,
        imageUrl: '',
        inStock: true,
      },
    ]);
    httpMock.verify();
  });

  it('debe traducir el fallo del catálogo a un mensaje de negocio', () => {
    build();
    let error: Error | undefined;

    service.listVendorProducts().subscribe({ error: (err: Error) => (error = err) });
    httpMock
      .expectOne('https://api.test/vendedores/me/productos')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(error?.message).toBe('No se pudo cargar tu catálogo.');
  });

  it('debe exigir apiUrl configurada cuando el entorno no define backend', () => {
    environment.apiUrl = '';
    build();
    let error: Error | undefined;

    service.listVendorProducts().subscribe({ error: (err: Error) => (error = err) });

    expect(error?.message).toContain('apiUrl no configurado');
  });
});
