import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { Storefront } from '../repositories/product.repository';
import { environment } from '../../../../environments/environment';
import { MOCK_PRODUCTS, MOCK_STORE } from '../mocks/product.mock';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  const originalApiUrl = environment.apiUrl;
  const originalDataSource = environment.apiConfig.dataSource;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
    environment.apiConfig.dataSource = originalDataSource;
  });

  it('debe pedir el storefront de la tienda y adaptar tienda + ofertas', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: Storefront | undefined;

    service.getStorefront('tienda-1').subscribe((storefront) => (result = storefront));

    const storefrontRequest = httpMock.expectOne('https://api.test/tiendas/tienda-1');
    expect(storefrontRequest.request.method).toBe('GET');
    httpMock.expectOne('https://api.test/catalog/productos').flush({ items: [] });

    storefrontRequest.flush({
      tienda: { id: 'tienda-1', nombre: 'Mi Tienda', descripcion: 'Demo' },
      ofertas: [
        {
          id: 'of-1',
          producto_id: 'p-1',
          producto_nombre: 'Teclado',
          precio_venta: '1380.00',
          stock: 10,
          sku: 'SKU-TEC',
        },
      ],
    });

    expect(result?.store).toMatchObject({ id: 'tienda-1', name: 'Mi Tienda' });
    expect(result?.products[0]).toMatchObject({
      id: 'of-1',
      name: 'Teclado',
      price: 1380,
      stock: 10,
    });
  });

  it('debe enriquecer la oferta con descripción y categoría del catálogo', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: Storefront | undefined;

    service.getStorefront('tienda-1').subscribe((storefront) => (result = storefront));

    httpMock.expectOne('https://api.test/catalog/productos').flush({
      items: [
        {
          id: 'p-1',
          sku: 'SKU-TEC',
          nombre: 'Teclado',
          descripcion: 'RGB',
          categoria: 'Periféricos',
        },
      ],
    });
    httpMock.expectOne('https://api.test/tiendas/tienda-1').flush({
      tienda: { id: 'tienda-1', nombre: 'Mi Tienda' },
      ofertas: [
        {
          id: 'of-1',
          producto_id: 'p-1',
          producto_nombre: 'Teclado',
          precio_venta: '1380.00',
          stock: 10,
          sku: 'SKU-TEC',
        },
      ],
    });

    expect(result?.products[0]).toMatchObject({
      description: 'RGB',
      category: 'Periféricos',
    });
  });

  it('debe cargar el storefront aunque el catálogo falle (best-effort)', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: Storefront | undefined;

    service.getStorefront('tienda-1').subscribe((storefront) => (result = storefront));

    httpMock.expectOne('https://api.test/catalog/productos').error(new ProgressEvent('error'));
    httpMock.expectOne('https://api.test/tiendas/tienda-1').flush({
      tienda: { id: 'tienda-1' },
      ofertas: [{ id: 'of-1', producto_nombre: 'Teclado', precio_venta: '100.00', stock: 1 }],
    });

    expect(result?.products[0]).toMatchObject({ name: 'Teclado', category: 'General' });
  });

  it('debe usar los mocks cuando dataSource es mock', async () => {
    environment.apiConfig.dataSource = 'mock';
    build();
    let result: Storefront | undefined;

    service.getStorefront('cualquiera').subscribe((storefront) => (result = storefront));

    await vi.waitFor(() => expect(result).toBeDefined());
    expect(result?.store).toEqual(MOCK_STORE);
    expect(result?.products).toEqual(MOCK_PRODUCTS);
  });

  it('debe emitir un error cuando no hay apiUrl configurada', () => {
    environment.apiUrl = '';
    build();
    let error: Error | undefined;

    service.getStorefront('tienda-1').subscribe({ error: (err: Error) => (error = err) });

    expect(error?.message).toContain('apiUrl no configurado');
  });
});
