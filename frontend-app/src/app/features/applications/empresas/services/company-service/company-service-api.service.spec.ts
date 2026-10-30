import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../../environments/environment';
import { CompanyServiceApiService } from './company-service-api.service';

const SERVICE_RAW = {
  id: 'srv-1',
  empresa_id: 'e-1',
  codigo: 'SRV-001',
  nombre: 'Mantenimiento',
  descripcion: 'Demo',
  categoria: 'Soporte',
  marca: 'Marca Demo',
  codigo_barras: '750123',
  precio: '1500.00',
  costo: '500.00',
  unidad: 'Hora (h)',
  duracion_minutos: 90,
  estado: 'activo',
  creado_en: '2026-10-27T00:00:00.000Z',
  actualizado_en: '2026-10-27T00:00:00.000Z',
};

describe('CompanyServiceApiService', () => {
  let service: CompanyServiceApiService;
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CompanyServiceApiService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => {
    environment.apiUrl = 'https://api.test';
    TestBed.resetTestingModule();
    build();
  });

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
    httpMock.verify();
  });

  it('debe listar servicios desde un envelope items', () => {
    let result: unknown;
    service.list().subscribe((items) => (result = items));

    const request = httpMock.expectOne(
      (candidate) =>
        candidate.url === 'https://api.test/catalog/servicios' &&
        candidate.params.get('limite') === '100' &&
        !candidate.params.has('pagina'),
    );
    expect(request.request.method).toBe('GET');
    request.flush({ items: [SERVICE_RAW], total: 1, pagina: 1, limite: 100, paginas: 1 });

    expect(result).toMatchObject([
      { id: 'srv-1', code: 'SRV-001', price: 1500, cost: 500, durationMinutes: 90 },
    ]);
  });

  it('debe listar desde un array directo y descartar inválidos', () => {
    let result: unknown;
    service.list().subscribe((items) => (result = items));

    httpMock
      .expectOne(
        (candidate) =>
          candidate.url === 'https://api.test/catalog/servicios' &&
          candidate.params.get('limite') === '100',
      )
      .flush([SERVICE_RAW, { id: 'sin-datos' }]);

    expect(result).toHaveLength(1);
  });

  it('debe unir todas las páginas anunciadas por el backend', () => {
    let result: unknown;
    service.list().subscribe((items) => (result = items));

    const first = httpMock.expectOne(
      (request) =>
        request.url === 'https://api.test/catalog/servicios' && !request.params.has('pagina'),
    );
    first.flush({ items: [SERVICE_RAW], total: 2, pagina: 1, paginas: 2 });

    const second = httpMock.expectOne(
      (request) =>
        request.url === 'https://api.test/catalog/servicios' &&
        request.params.get('limite') === '100' &&
        request.params.get('pagina') === '2',
    );
    second.flush({
      items: [{ ...SERVICE_RAW, id: 'srv-2', codigo: 'SRV-002' }],
      total: 2,
      pagina: 2,
      paginas: 2,
    });

    expect(result).toHaveLength(2);
  });

  it('debe crear un servicio con el payload snake_case completo', () => {
    let result: unknown;
    service
      .create({
        code: 'srv-002',
        name: 'Instalación',
        description: 'En sitio',
        category: 'Campo',
        brand: 'Marca',
        barcode: '750999',
        price: '250.50',
        cost: '100.00',
        unit: 'Servicio',
        durationMinutes: 120,
        status: 'inactivo',
      })
      .subscribe((created) => (result = created));

    const request = httpMock.expectOne('https://api.test/catalog/servicios');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      codigo: 'srv-002',
      nombre: 'Instalación',
      descripcion: 'En sitio',
      categoria: 'Campo',
      marca: 'Marca',
      codigo_barras: '750999',
      precio: '250.50',
      costo: '100.00',
      unidad: 'Servicio',
      duracion_minutos: 120,
      estado: 'inactivo',
    });
    request.flush({ data: SERVICE_RAW });

    expect(result).toMatchObject({ id: 'srv-1', name: 'Mantenimiento' });
  });

  it('debe actualizar un servicio sin enviar el código', () => {
    service.update('srv-1', { name: 'Nuevo', price: '120.00' }).subscribe();

    const request = httpMock.expectOne('https://api.test/catalog/servicios/srv-1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ nombre: 'Nuevo', precio: '120.00' });
    request.flush(SERVICE_RAW);
  });

  it('debe eliminar un servicio', () => {
    let completed = false;
    service.remove('srv-1').subscribe({ complete: () => (completed = true) });

    const request = httpMock.expectOne('https://api.test/catalog/servicios/srv-1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    expect(completed).toBe(true);
  });

  it('debe traducir errores del backend en cada operación', () => {
    const errors: string[] = [];
    service.list().subscribe({ error: (error: Error) => errors.push(error.message) });
    httpMock
      .expectOne(
        (candidate) =>
          candidate.url === 'https://api.test/catalog/servicios' &&
          candidate.params.get('limite') === '100',
      )
      .flush({ mensaje: 'listado falló' }, { status: 400, statusText: 'Bad Request' });

    service.create({ code: 'SRV-1', name: 'Uno', price: '1.00', durationMinutes: 30 }).subscribe({
      error: (error: Error) => errors.push(error.message),
    });
    httpMock
      .expectOne('https://api.test/catalog/servicios')
      .flush({}, { status: 500, statusText: 'Server Error' });

    service.update('srv-1', { name: 'Dos' }).subscribe({
      error: (error: Error) => errors.push(error.message),
    });
    httpMock
      .expectOne('https://api.test/catalog/servicios/srv-1')
      .flush({ mensaje: 'edición falló' }, { status: 409, statusText: 'Conflict' });

    service.remove('srv-1').subscribe({ error: (error: Error) => errors.push(error.message) });
    httpMock
      .expectOne('https://api.test/catalog/servicios/srv-1')
      .flush({}, { status: 403, statusText: 'Forbidden' });

    expect(errors).toEqual([
      'listado falló',
      'No se pudo crear el servicio.',
      'edición falló',
      expect.stringContaining('cuenta de vendedor'),
    ]);
  });

  it('debe rechazar respuestas de servicio no interpretables', () => {
    const errors: string[] = [];
    service.create({ code: 'SRV-1', name: 'Uno', price: '1.00', durationMinutes: 30 }).subscribe({
      error: (error: Error) => errors.push(error.message),
    });
    httpMock.expectOne('https://api.test/catalog/servicios').flush({ id: 'sin-campos' });

    service.update('srv-1', { name: 'Dos' }).subscribe({
      error: (error: Error) => errors.push(error.message),
    });
    httpMock.expectOne('https://api.test/catalog/servicios/srv-1').flush([{ id: 'sin-campos' }]);

    expect(errors).toEqual([
      'No se pudo interpretar el servicio.',
      'No se pudo interpretar el servicio.',
    ]);
  });

  it('debe emitir error cuando no hay apiUrl', () => {
    environment.apiUrl = '';
    const errors: Error[] = [];

    service.list().subscribe({ error: (error: Error) => errors.push(error) });
    service.create({ code: 'SRV-1', name: 'Uno', price: '1.00', durationMinutes: 30 }).subscribe({
      error: (error: Error) => errors.push(error),
    });
    service.update('srv-1', { name: 'Dos' }).subscribe({
      error: (error: Error) => errors.push(error),
    });
    service.remove('srv-1').subscribe({ error: (error: Error) => errors.push(error) });

    expect(errors).toHaveLength(4);
    expect(errors.every((error) => error.message.includes('apiUrl no configurado'))).toBe(true);
  });
});
