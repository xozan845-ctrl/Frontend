import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { Product } from '../models/product.model';
import { environment } from '../../../../environments/environment';
import { MOCK_PRODUCTS } from '../mocks/product.mock';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  const originalApiUrl = environment.apiUrl;
  const originalDataSource = environment.apiConfig.dataSource;
  const originalStoreId = environment.apiConfig.storeId;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => {
    environment.apiConfig.storeId = '';
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
    environment.apiConfig.dataSource = originalDataSource;
    environment.apiConfig.storeId = originalStoreId;
  });

  it('debe pedir los productos por GET y adaptar la respuesta', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: Product[] = [];

    service.getProducts().subscribe((products) => (result = products));
    const request = httpMock.expectOne('https://api.test/catalog/productos');
    expect(request.request.method).toBe('GET');
    request.flush({ items: [{ id: 1, nombre: 'Teclado', precio_base: '50.00' }] });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Teclado');
  });

  it('debe pedir el detalle por id', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: Product | undefined;

    service.getProductById(7).subscribe((product) => (result = product));
    const request = httpMock.expectOne('https://api.test/catalog/productos/7');
    request.flush({ id: 7, nombre: 'Mouse', precio_base: '20.00' });

    expect(result?.name).toBe('Mouse');
  });

  it('debe derivar las categorías de los productos', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: string[] = [];

    service.getCategories().subscribe((categories) => (result = categories));
    httpMock.expectOne('https://api.test/catalog/productos').flush({
      items: [
        { id: 1, nombre: 'A', precio_base: '1.00', categoria: 'Audio' },
        { id: 2, nombre: 'B', precio_base: '2.00', categoria: 'Audio' },
        { id: 3, nombre: 'C', precio_base: '3.00', categoria: 'Video' },
      ],
    });

    expect(result).toEqual(['Audio', 'Video']);
  });

  it('debe usar los mocks cuando dataSource es mock', () => {
    environment.apiConfig.dataSource = 'mock';
    build();
    let result: Product[] = [];

    service.getProducts().subscribe((products) => (result = products));

    expect(result).toEqual(MOCK_PRODUCTS);
  });

  it('debe emitir un error cuando no hay apiUrl configurada', () => {
    environment.apiUrl = '';
    build();
    let error: Error | undefined;

    service.getProducts().subscribe({ error: (err: Error) => (error = err) });

    expect(error?.message).toContain('apiUrl no configurado');
  });

  it('debe devolver el producto mock por id', () => {
    environment.apiConfig.dataSource = 'mock';
    build();
    let result: Product | undefined;

    service.getProductById(MOCK_PRODUCTS[0].id).subscribe((product) => (result = product));

    expect(result?.id).toBe(MOCK_PRODUCTS[0].id);
  });

  it('debe devolver el primer producto mock cuando el id no existe', () => {
    environment.apiConfig.dataSource = 'mock';
    build();
    let result: Product | undefined;

    service.getProductById('no-existe').subscribe((product) => (result = product));

    expect(result).toEqual(MOCK_PRODUCTS[0]);
  });

  it('debe devolver categorías únicas en mock', () => {
    environment.apiConfig.dataSource = 'mock';
    build();
    let result: string[] = [];

    service.getCategories().subscribe((categories) => (result = categories));

    const expected = Array.from(new Set(MOCK_PRODUCTS.map((p) => p.category)));
    expect(result).toEqual(expected);
  });

  it('debe fallar el detalle cuando no hay apiUrl configurada', () => {
    environment.apiUrl = '';
    build();
    let error: Error | undefined;

    service.getProductById(1).subscribe({ error: (err: Error) => (error = err) });

    expect(error?.message).toContain('apiUrl no configurado');
  });

  it('debe mapear el contrato de Core Engine (nombre/precio_base/categoria)', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: Product[] = [];

    service.getProducts().subscribe((products) => (result = products));
    httpMock.expectOne('https://api.test/catalog/productos').flush({
      items: [
        {
          id: 'p1',
          sku: 'SKU-1',
          nombre: 'Teclado',
          descripcion: 'RGB',
          categoria: 'Periféricos',
          precio_base: '1000.00',
          stock: 5,
          estado: 'disponible',
        },
      ],
    });

    expect(result[0]).toMatchObject({
      id: 'p1',
      name: 'Teclado',
      description: 'RGB',
      category: 'Periféricos',
      price: 1000,
      stock: 5,
    });
  });

  it('debe fallar las categorías cuando no hay apiUrl configurada', () => {
    environment.apiUrl = '';
    build();
    let error: Error | undefined;

    service.getCategories().subscribe({ error: (err: Error) => (error = err) });

    expect(error?.message).toContain('apiUrl no configurado');
  });

  it('debe listar las ofertas de la tienda configurada (storefront)', () => {
    environment.apiUrl = 'https://api.test';
    environment.apiConfig.storeId = 'tienda-1';
    build();
    let result: Product[] = [];

    service.getProducts().subscribe((products) => (result = products));
    httpMock.expectOne('https://api.test/tiendas/tienda-1').flush({
      tienda: { id: 'tienda-1' },
      ofertas: [
        {
          id: 'of-1',
          producto_nombre: 'Teclado',
          precio_venta: '1380.00',
          stock: 10,
          sku: 'SKU-TEC',
        },
      ],
    });

    expect(result[0]).toMatchObject({ id: 'of-1', name: 'Teclado', price: 1380, stock: 10 });
  });
});
