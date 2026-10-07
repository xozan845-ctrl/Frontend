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

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
    environment.apiConfig.dataSource = originalDataSource;
  });

  it('debe pedir los productos por GET y adaptar la respuesta', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: Product[] = [];

    service.getProducts().subscribe((products) => (result = products));
    const request = httpMock.expectOne('https://api.test/products');
    expect(request.request.method).toBe('GET');
    request.flush({ data: [{ id: 1, name: 'Teclado', price: 50 }] });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Teclado');
  });

  it('debe pedir el detalle por id', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: Product | undefined;

    service.getProductById(7).subscribe((product) => (result = product));
    const request = httpMock.expectOne('https://api.test/products/7');
    request.flush({ data: { id: 7, name: 'Mouse', price: 20 } });

    expect(result?.name).toBe('Mouse');
  });

  it('debe devolver las categorías del backend', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: string[] = [];

    service.getCategories().subscribe((categories) => (result = categories));
    const request = httpMock.expectOne('https://api.test/categories');
    request.flush({ data: ['Audio', 'Video'] });

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

  it('debe caer a los productos cuando el endpoint de categorías falla', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: string[] = [];

    service.getCategories().subscribe((categories) => (result = categories));
    httpMock
      .expectOne('https://api.test/categories')
      .flush('boom', { status: 500, statusText: 'Server Error' });
    httpMock.expectOne('https://api.test/products').flush({
      data: [
        { id: 1, name: 'A', price: 1, category: 'Audio' },
        { id: 2, name: 'B', price: 2, category: 'Audio' },
        { id: 3, name: 'C', price: 3, category: 'Video' },
      ],
    });

    expect(result).toEqual(['Audio', 'Video']);
  });

  it('debe fallar las categorías cuando no hay apiUrl configurada', () => {
    environment.apiUrl = '';
    build();
    let error: Error | undefined;

    service.getCategories().subscribe({ error: (err: Error) => (error = err) });

    expect(error?.message).toContain('apiUrl no configurado');
  });

  it('debe normalizar categorías que llegan como objeto', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: string[] = [];

    service.getCategories().subscribe((categories) => (result = categories));
    httpMock
      .expectOne('https://api.test/categories')
      .flush({ data: [{ name: 'Audio' }, { title: 'Video' }, {}] });

    expect(result).toEqual(['Audio', 'Video', 'General']);
  });
});
