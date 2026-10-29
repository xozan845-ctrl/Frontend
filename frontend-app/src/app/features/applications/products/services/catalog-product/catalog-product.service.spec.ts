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
      .list({
        companyId: ' empresa-1 ',
        q: ' teclado ',
        status: 'disponible',
        category: 'Periféricos',
        page: 2,
        limit: 10,
      })
      .subscribe((page) => (result = page));

    const request = httpMock.expectOne(
      (req) =>
        req.url === 'https://api.test/catalog/productos' &&
        req.params.get('empresa_id') === 'empresa-1' &&
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

    service.getById('p-1', 'empresa-1').subscribe((product) => (result = product));

    const request = httpMock.expectOne(
      (request) =>
        request.url === 'https://api.test/catalog/productos/p-1' &&
        request.params.get('empresa_id') === 'empresa-1',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('empresa_id')).toBe('empresa-1');
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
        companyId: 'empresa-1',
        name: 'Teclado',
        description: 'Demo',
        category: 'Periféricos',
        basePrice: '100.00',
        stock: 5,
        attributes: { color: 'negro' },
        images: [{ objectId: 'obj-1', order: 0, isPrimary: true }],
        variants: [
          {
            sku: 'SKU-1-RED',
            name: 'Rojo',
            attributes: { color: 'rojo' },
            basePrice: '110.00',
            stock: 2,
          },
        ],
      })
      .subscribe((product) => (result = product));

    const request = httpMock.expectOne('https://api.test/catalog/productos');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      sku: 'SKU-1',
      empresa_id: 'empresa-1',
      nombre: 'Teclado',
      descripcion: 'Demo',
      categoria: 'Periféricos',
      precio_base: '100.00',
      stock: 5,
      atributos: { color: 'negro' },
      imagenes: [{ objeto_id: 'obj-1', orden: 0, es_principal: true }],
      variantes: [
        {
          sku: 'SKU-1-RED',
          nombre: 'Rojo',
          atributos: { color: 'rojo' },
          precio_base: '110.00',
          stock: 2,
        },
      ],
    });
    request.flush({ id: 'p-1', sku: 'SKU-1', nombre: 'Teclado', precio_base: '100.00', stock: 5 });

    expect(result).toMatchObject({ id: 'p-1', basePrice: 100 });
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
      precio_base: '120.00',
      stock: 8,
      motivo: 'ajuste',
    });
    request.flush({ id: 'p-1', sku: 'SKU-1', nombre: 'Nuevo', precio_base: '120.00', stock: 8 });

    expect(result).toMatchObject({ name: 'Nuevo', basePrice: 120, stock: 8 });
  });

  it('debe crear, actualizar y eliminar una variante', () => {
    environment.apiUrl = 'https://api.test';
    build();

    service
      .createVariant('p-1', {
        sku: 'SKU-RED',
        name: 'Rojo',
        attributes: { color: 'rojo' },
        basePrice: '110.00',
        stock: 3,
      })
      .subscribe();
    const createRequest = httpMock.expectOne('https://api.test/catalog/productos/p-1/variantes');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({
      sku: 'SKU-RED',
      nombre: 'Rojo',
      atributos: { color: 'rojo' },
      precio_base: '110.00',
      stock: 3,
    });
    createRequest.flush({ id: 'p-1', nombre: 'Teclado' });

    service.updateVariant('p-1', 'v-1', { stock: 4, attributes: { color: 'azul' } }).subscribe();
    const updateRequest = httpMock.expectOne(
      'https://api.test/catalog/productos/p-1/variantes/v-1',
    );
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({
      stock: 4,
      atributos: { color: 'azul' },
    });
    updateRequest.flush({ id: 'p-1', nombre: 'Teclado' });

    service.deleteVariant('p-1', 'v-1').subscribe();
    const deleteRequest = httpMock.expectOne(
      'https://api.test/catalog/productos/p-1/variantes/v-1',
    );
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
  });

  it('debe agregar y eliminar imágenes', () => {
    environment.apiUrl = 'https://api.test';
    build();

    service.addImage('p-1', { objectId: 'obj-1', order: 0, isPrimary: true }).subscribe();
    const addRequest = httpMock.expectOne('https://api.test/catalog/productos/p-1/imagenes');
    expect(addRequest.request.method).toBe('POST');
    expect(addRequest.request.body).toEqual({
      objeto_id: 'obj-1',
      orden: 0,
      es_principal: true,
    });
    addRequest.flush({ id: 'p-1', nombre: 'Teclado' });

    service.deleteImage('p-1', 'img-1').subscribe();
    const deleteRequest = httpMock.expectOne(
      'https://api.test/catalog/productos/p-1/imagenes/img-1',
    );
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
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
    service.getById('p-1', 'empresa-1').subscribe({ error: (e: Error) => errors.push(e) });
    service.create({ sku: 'S', name: 'X', basePrice: '1.00', stock: 1 }).subscribe({
      error: (e: Error) => errors.push(e),
    });
    service.update('p-1', { stock: 1 }).subscribe({ error: (e: Error) => errors.push(e) });

    service.createVariant('p-1', { sku: 'S', basePrice: '1.00', stock: 1 }).subscribe({
      error: (e: Error) => errors.push(e),
    });
    service.updateVariant('p-1', 'v-1', { stock: 1 }).subscribe({
      error: (e: Error) => errors.push(e),
    });
    service.deleteVariant('p-1', 'v-1').subscribe({ error: (e: Error) => errors.push(e) });
    service.addImage('p-1', { objectId: 'obj-1' }).subscribe({
      error: (e: Error) => errors.push(e),
    });
    service.deleteImage('p-1', 'img-1').subscribe({ error: (e: Error) => errors.push(e) });

    expect(errors).toHaveLength(10);
    expect(errors.every((error) => error.message.includes('apiUrl no configurado'))).toBe(true);
  });
});
