import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RutaService } from './ruta.service';
import { environment } from '../../../../../../environments/environment';
import { RUTAS_FIXTURE } from '../../adapters/fixtures/ruta.fixture';

describe('RutaService', () => {
  let service: RutaService;
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RutaService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
  });

  it('debe listar rutas con paradas', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service.list().subscribe((routes) => (result = routes));

    httpMock.expectOne('https://api.test/field/rutas').flush(RUTAS_FIXTURE);

    expect(result).toHaveLength(1);
  });

  it('debe actualizar el estado de una ruta', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service.updateStatus('ruta-1', 'en_curso').subscribe((route) => (result = route));

    const request = httpMock.expectOne('https://api.test/field/rutas/ruta-1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ estado: 'en_curso' });
    request.flush({ ...RUTAS_FIXTURE[0], estado: 'en_curso', paradas: undefined });

    expect(result).toMatchObject({ id: 'ruta-1', status: 'en_curso' });
  });

  it('debe actualizar una parada con nombre y completada', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service
      .updateStop('ruta-1', 'parada-1', { name: 'Farmacia Central', completed: true })
      .subscribe((stop) => (result = stop));

    const request = httpMock.expectOne('https://api.test/field/rutas/ruta-1/paradas/parada-1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      nombre: 'Farmacia Central',
      completada: true,
    });
    request.flush({ ...RUTAS_FIXTURE[0].paradas[0], completada: true });

    expect(result).toMatchObject({ id: 'parada-1', completed: true });
  });

  it('debe traducir errores y fallar sin apiUrl', () => {
    environment.apiUrl = 'https://api.test';
    build();
    const errors: Error[] = [];

    service.list().subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/field/rutas')
      .flush({ mensaje: 'Sin ruta.' }, { status: 404, statusText: 'Not Found' });

    service.updateStatus('ruta-1', 'cancelada').subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/field/rutas/ruta-1')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(errors[0].message).toBe('Sin ruta.');
    expect(errors[1].message).toBe('No se pudo actualizar la ruta.');

    environment.apiUrl = '';
    const missing: Error[] = [];
    service.list().subscribe({ error: (e: Error) => missing.push(e) });
    service.updateStop('ruta-1', 'parada-1', { name: 'P', completed: true }).subscribe({
      error: (e: Error) => missing.push(e),
    });

    expect(missing).toHaveLength(2);
    missing.forEach((error) => expect(error.message).toContain('apiUrl no configurado'));
  });
});
