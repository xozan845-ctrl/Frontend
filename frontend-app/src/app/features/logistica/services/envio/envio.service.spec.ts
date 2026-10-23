import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvioService } from './envio.service';
import { environment } from '../../../../../environments/environment';

describe('EnvioService', () => {
  let service: EnvioService;
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EnvioService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
  });

  it('debe listar envíos para admin y empresa', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let admin: unknown;
    let company: unknown;

    service.listAdmin().subscribe((items) => (admin = items));
    service.listCompany().subscribe((items) => (company = items));

    httpMock.expectOne('https://api.test/admin/envios').flush([{ id: 'e-1' }]);
    httpMock.expectOne('https://api.test/empresarios/me/envios').flush([{ id: 'e-2' }]);

    expect(admin).toHaveLength(1);
    expect(company).toHaveLength(1);
  });

  it('debe asignar flota a un envío híbrido', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service.assignProvider('e-1', 'empresa').subscribe((shipment) => (result = shipment));

    const request = httpMock.expectOne('https://api.test/empresarios/me/envios/e-1/asignacion');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ proveedor_tipo: 'empresa' });
    request.flush({ id: 'e-1', estado: 'en_preparacion', proveedor_tipo: 'empresa' });

    expect(result).toMatchObject({ id: 'e-1', providerType: 'empresa' });
  });

  it('debe avanzar el estado de un envío', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service
      .advanceStatus('e-1', 'enviada', 'despacho')
      .subscribe((shipment) => (result = shipment));

    const request = httpMock.expectOne('https://api.test/envios/e-1/estado');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ estado: 'enviada', motivo: 'despacho' });
    request.flush({ id: 'e-1', estado: 'enviada' });

    expect(result).toMatchObject({ id: 'e-1', status: 'enviada' });
  });

  it('debe traducir errores de listado y mutaciones', () => {
    environment.apiUrl = 'https://api.test';
    build();
    const errors: Error[] = [];

    service.listCompany().subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/empresarios/me/envios')
      .flush({ mensaje: 'Sin empresa.' }, { status: 400, statusText: 'Bad Request' });

    service.advanceStatus('e-1', 'enviada').subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/envios/e-1/estado')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(errors[0].message).toBe('Sin empresa.');
    expect(errors[1].message).toBe('No se pudo actualizar el estado del envío.');
  });

  it('debe fallar sin apiUrl', () => {
    environment.apiUrl = '';
    build();
    const errors: Error[] = [];

    service.listAdmin().subscribe({ error: (e: Error) => errors.push(e) });
    service.listCompany().subscribe({ error: (e: Error) => errors.push(e) });
    service.assignProvider('e-1', 'plataforma').subscribe({ error: (e: Error) => errors.push(e) });
    service.advanceStatus('e-1', 'enviada').subscribe({ error: (e: Error) => errors.push(e) });

    expect(errors).toHaveLength(4);
    errors.forEach((error) => expect(error.message).toContain('apiUrl no configurado'));
  });
});
