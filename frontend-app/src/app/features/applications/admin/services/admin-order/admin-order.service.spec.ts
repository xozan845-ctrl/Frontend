import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminOrderService } from './admin-order.service';
import { environment } from '../../../../../../environments/environment';

describe('AdminOrderService', () => {
  let service: AdminOrderService;
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
  });

  it('debe listar todas las órdenes con filtro y límite', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service.listAll('pagada', 50).subscribe((orders) => (result = orders));

    const request = httpMock.expectOne(
      (req) =>
        req.url === 'https://api.test/orders/admin/todas' &&
        req.params.get('estado') === 'pagada' &&
        req.params.get('limite') === '50',
    );
    request.flush([{ id: 'o-1', estado: 'pagada', total_cents: 1000 }]);

    expect(result).toHaveLength(1);
  });

  it('debe obtener detalle y timeline', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let order: unknown;
    let timeline: unknown;

    service.getOrder('o-1').subscribe((response) => (order = response));
    service.getTimeline('o-1').subscribe((response) => (timeline = response));

    httpMock.expectOne('https://api.test/orders/o-1').flush({ id: 'o-1', estado: 'pagada' });
    httpMock
      .expectOne('https://api.test/orders/o-1/timeline')
      .flush([{ id: 1, tipo: 'OrderCreatedEvent', version: 1 }]);

    expect(order).toMatchObject({ id: 'o-1', status: 'pagada' });
    expect(timeline).toHaveLength(1);
  });

  it('debe avanzar el estado y devolver el resultado', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service.advanceStatus('o-1', 'enviada', 'despacho').subscribe((update) => (result = update));

    const request = httpMock.expectOne('https://api.test/orders/o-1/estado');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ estado: 'enviada', motivo: 'despacho' });
    request.flush({ id: 'o-1', estado: 'enviada' });

    expect(result).toEqual({ id: 'o-1', status: 'enviada' });
  });

  it('debe traducir errores de listado y transición', () => {
    environment.apiUrl = 'https://api.test';
    build();
    const errors: Error[] = [];

    service.listAll().subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/orders/admin/todas')
      .flush({ mensaje: 'Solo administradores.' }, { status: 403, statusText: 'Forbidden' });

    service.advanceStatus('o-1', 'enviada').subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/orders/o-1/estado')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(errors[0].message).toBe('Solo administradores.');
    expect(errors[1].message).toBe('No se pudo actualizar el estado de la orden.');
  });

  it('debe fallar sin apiUrl configurada', () => {
    environment.apiUrl = '';
    build();
    const errors: Error[] = [];

    service.listAll().subscribe({ error: (e: Error) => errors.push(e) });
    service.getOrder('o-1').subscribe({ error: (e: Error) => errors.push(e) });
    service.getTimeline('o-1').subscribe({ error: (e: Error) => errors.push(e) });
    service.advanceStatus('o-1', 'enviada').subscribe({ error: (e: Error) => errors.push(e) });

    expect(errors).toHaveLength(4);
    errors.forEach((error) => expect(error.message).toContain('apiUrl no configurado'));
  });
});
