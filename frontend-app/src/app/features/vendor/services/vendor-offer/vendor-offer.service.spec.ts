import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VendorOfferService } from './vendor-offer.service';
import { environment } from '../../../../../environments/environment';

describe('VendorOfferService', () => {
  let service: VendorOfferService;
  let httpMock: HttpTestingController;

  const originalApiUrl = environment.apiUrl;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VendorOfferService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
  });

  it('debe listar las ofertas con paginación', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service.listOffers(2, 10).subscribe((page) => (result = page));

    const request = httpMock.expectOne('https://api.test/vendedores/me/ofertas?pagina=2&limite=10');
    expect(request.request.method).toBe('GET');
    request.flush({
      items: [{ id: 'of-1', producto_nombre: 'Teclado', margen: 15, precio_venta: '1150.00' }],
      total: 11,
      pagina: 2,
      limite: 10,
      paginas: 2,
    });

    expect(result).toMatchObject({
      total: 11,
      page: 2,
      limit: 10,
      pages: 2,
      items: [{ id: 'of-1', productName: 'Teclado', margin: 15, salePrice: 1150 }],
    });
  });

  it('debe cambiar el margen de una oferta', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service.updateMargin('of-1', 25).subscribe((offer) => (result = offer));

    const request = httpMock.expectOne('https://api.test/vendedores/productos/of-1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ margen: 25 });
    request.flush({
      id: 'of-1',
      producto_nombre: 'Teclado',
      margen: 25,
      precio_venta: '1250.00',
    });

    expect(result).toMatchObject({ id: 'of-1', margin: 25, salePrice: 1250 });
  });

  it('debe traducir el error al listar ofertas', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.listOffers(1, 20).subscribe({ error: (e: Error) => (error = e) });
    httpMock
      .expectOne('https://api.test/vendedores/me/ofertas?pagina=1&limite=20')
      .flush({ mensaje: 'Sesión expirada.' }, { status: 401, statusText: 'Unauthorized' });

    expect(error?.message).toBe('Sesión expirada.');
  });

  it('debe traducir el error al cambiar el margen', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.updateMargin('of-1', 95).subscribe({ error: (e: Error) => (error = e) });
    httpMock
      .expectOne('https://api.test/vendedores/productos/of-1')
      .flush(
        { mensaje: 'El margen debe estar entre 0 y 90.' },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(error?.message).toBe('El margen debe estar entre 0 y 90.');
  });

  it('debe degradar cuando la oferta actualizada no se puede interpretar', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.updateMargin('of-1', 10).subscribe({ error: (e: Error) => (error = e) });
    httpMock.expectOne('https://api.test/vendedores/productos/of-1').flush({ sin: 'id' });

    expect(error?.message).toBe('No se pudo interpretar la oferta actualizada.');
  });

  it('debe emitir un error cuando no hay apiUrl configurada', () => {
    environment.apiUrl = '';
    build();
    const errors: Error[] = [];

    service.listOffers(1, 20).subscribe({ error: (e: Error) => errors.push(e) });
    service.updateMargin('of-1', 10).subscribe({ error: (e: Error) => errors.push(e) });

    expect(errors).toHaveLength(2);
    expect(errors.every((error) => error.message.includes('apiUrl no configurado'))).toBe(true);
  });
});
