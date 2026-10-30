import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CatalogProductService } from './catalog-product.service';
import { environment } from '../../../../../../environments/environment';

describe('CatalogProductService', () => {
  let service: CatalogProductService;
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CatalogProductService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
  });

  it('debe listar con filtros y paginación', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service
      .list({ q: ' teclado ', status: 'disponible', category: 'Periféricos', page: 2, limit: 10 })
      .subscribe((page) => (result = page));

    const request = httpMock.expectOne(
      (req) =>
        req.url === 'https://api.test/catalog/productos' &&
        req.params.get('q') === 'teclado' &&
        req.params.get('estado') === 'disponible' &&
        req.params.get('categoria') === 'Periféricos' &&
        req.params.get('pagina') === '2' &&
        req.params.get('limite') === '10',
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      items: [{ id: 'p-1', sku: 'SKU-1', nombre: 'Teclado', precio_base: '100.00', stock: 2 }],
      total: 1,
      pagina: 2,
      limite: 10,
      paginas: 1,
    });

    expect(result).toMatchObject({ total: 1, page: 2, limit: 10, pages: 1 });
  });

  it('debe omitir pagina/limite cuando son los valores por defecto', () => {
    environment.apiUrl = 'https://api.test';
    build();

    service.list({ page: 1, limit: 20 }).subscribe();

    const request = httpMock.expectOne('https://api.test/catalog/productos');
    expect(request.request.params.keys()).toEqual([]);
    request.flush({ items: [], total: 0, pagina: 1, limite: 20, paginas: 1 });
  });

  it('debe obtener el detalle por id', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service.getById('p-1').subscribe((product) => (result = product));

    const request = httpMock.expectOne('https://api.test/catalog/productos/p-1');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'p-1', sku: 'SKU-1', nombre: 'Teclado' });

    expect(result).toMatchObject({ id: 'p-1', sku: 'SKU-1', name: 'Teclado' });
  });

  it('debe crear un producto con el payload del contrato', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service
      .create({
        sku: 'SKU-1',
        name: 'Teclado',
        description: 'Demo',
        category: 'Periféricos',
        basePrice: '100.00',
        stock: 5,
      })
      .subscribe((product) => (result = product));

    const request = httpMock.expectOne('https://api.test/catalog/productos');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      sku: 'SKU-1',
      nombre: 'Teclado',
      descripcion: 'Demo',
      categoria: 'Periféricos',
      precio_base: '100.00',
      stock: 5,
    });
    request.flush({ id: 'p-1', sku: 'SKU-1', nombre: 'Teclado', precio_base: '100.00', stock: 5 });

    expect(result).toMatchObject({ id: 'p-1', basePrice: 100 });
  });

  it('debe enviar los metadatos operativos junto al producto (R-PS-01)', () => {
    environment.apiUrl = 'https://api.test';
    build();

    service
      .create({
        sku: 'SKU-2',
        name: 'Camisa',
        basePrice: '250.00',
        stock: 3,
        cost: '150.00',
        brand: 'Marca Demo',
        barcode: '750123',
        unit: 'Unidad (u)',
        allowFractions: true,
        purchaseUnit: 'Caja',
        contentAmount: 12,
        contentUnit: 'Unidades',
        priceType: 'escala',
        costType: 'fijo',
        minStock: 2,
        maxStock: 10,
        warrantyMonths: 6,
        isRawMaterial: true,
        location: 'A-1',
        operationalStatus: 'inactivo',
      })
      .subscribe();

    const request = httpMock.expectOne('https://api.test/catalog/productos');
    expect(request.request.body).toMatchObject({
      sku: 'SKU-2',
      costo: '150.00',
      marca: 'Marca Demo',
      codigo_barras: '750123',
      permite_fracciones: true,
      stock_minimo: 2,
      stock_maximo: 10,
      garantia_meses: 6,
      es_materia_prima: true,
      estado_operativo: 'inactivo',
    });
    request.flush({ id: 'p-2', sku: 'SKU-2', nombre: 'Camisa', precio_base: '250.00', stock: 3 });
  });

  it('debe actualizar un producto', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service
      .update('p-1', { name: 'Nuevo', basePrice: '120.00', stock: 8, reason: 'ajuste' })
      .subscribe((product) => (result = product));

    const request = httpMock.expectOne('https://api.test/catalog/productos/p-1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      nombre: 'Nuevo',
      descripcion: undefined,
      categoria: undefined,
      precio_base: '120.00',
      stock: 8,
      motivo: 'ajuste',
    });
    request.flush({ id: 'p-1', sku: 'SKU-1', nombre: 'Nuevo', precio_base: '120.00', stock: 8 });

    expect(result).toMatchObject({ name: 'Nuevo', basePrice: 120, stock: 8 });
  });

  it('debe traducir el 409 al crear (sku duplicado)', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service
      .create({ sku: 'SKU-1', name: 'Teclado', basePrice: '100.00', stock: 1 })
      .subscribe({ error: (e: Error) => (error = e) });
    httpMock
      .expectOne('https://api.test/catalog/productos')
      .flush(
        { mensaje: 'Ya existe un producto con el SKU SKU-1.' },
        { status: 409, statusText: 'Conflict' },
      );

    expect(error?.message).toBe('Ya existe un producto con el SKU SKU-1.');
  });

  it('debe traducir el error al actualizar', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.update('p-1', { stock: 1 }).subscribe({ error: (e: Error) => (error = e) });
    httpMock
      .expectOne('https://api.test/catalog/productos/p-1')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(error?.message).toBe('No se pudo actualizar el producto.');
  });

  it('debe emitir error cuando no hay apiUrl', () => {
    environment.apiUrl = '';
    build();
    const errors: Error[] = [];

    service.list({}).subscribe({ error: (e: Error) => errors.push(e) });
    service.getById('p-1').subscribe({ error: (e: Error) => errors.push(e) });
    service.create({ sku: 'S', name: 'X', basePrice: '1.00', stock: 1 }).subscribe({
      error: (e: Error) => errors.push(e),
    });
    service.update('p-1', { stock: 1 }).subscribe({ error: (e: Error) => errors.push(e) });

    expect(errors).toHaveLength(4);
    expect(errors.every((error) => error.message.includes('apiUrl no configurado'))).toBe(true);
  });
});
