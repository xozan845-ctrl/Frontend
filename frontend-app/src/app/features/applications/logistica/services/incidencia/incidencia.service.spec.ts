import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { IncidenciaService } from './incidencia.service';
import { environment } from '../../../../../../environments/environment';
import { INCIDENCIAS_FIXTURE } from '../../adapters/fixtures/incidencia.fixture';

describe('IncidenciaService', () => {
  let service: IncidenciaService;
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(IncidenciaService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
  });

  it('debe listar incidencias', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service.list().subscribe((incidents) => (result = incidents));

    httpMock.expectOne('https://api.test/field/incidencias').flush(INCIDENCIAS_FIXTURE);

    expect(result).toHaveLength(2);
  });

  it('debe actualizar estado y resolución', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service
      .update('incidencia-1', { status: 'en_progreso', resolution: 'En taller' })
      .subscribe((incident) => (result = incident));

    const request = httpMock.expectOne('https://api.test/field/incidencias/incidencia-1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ estado: 'en_progreso', resolucion: 'En taller' });
    request.flush({
      ...INCIDENCIAS_FIXTURE[0],
      estado: 'en_progreso',
      resolucion: 'En taller',
    });

    expect(result).toMatchObject({ id: 'incidencia-1', status: 'en_progreso' });
  });

  it('debe traducir errores y fallar sin apiUrl', () => {
    environment.apiUrl = 'https://api.test';
    build();
    const errors: Error[] = [];

    service.list().subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/field/incidencias')
      .flush({ mensaje: 'Sin acceso.' }, { status: 403, statusText: 'Forbidden' });

    service.update('incidencia-1', { status: 'resuelta' }).subscribe({
      error: (e: Error) => errors.push(e),
    });
    httpMock
      .expectOne('https://api.test/field/incidencias/incidencia-1')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(errors[0].message).toBe('Sin acceso.');
    expect(errors[1].message).toBe('No se pudo actualizar la incidencia.');

    environment.apiUrl = '';
    const missing: Error[] = [];
    service.list().subscribe({ error: (e: Error) => missing.push(e) });
    service.update('incidencia-1', { status: 'resuelta' }).subscribe({
      error: (e: Error) => missing.push(e),
    });

    expect(missing).toHaveLength(2);
    missing.forEach((error) => expect(error.message).toContain('apiUrl no configurado'));
  });
});
