import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { CreateOrderPayload, OrderResponse } from '../models/order.model';
import { environment } from '../../../../environments/environment';

const payload: CreateOrderPayload = {
  items: [{ ofertaId: 'of-1', quantity: 1 }],
};

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  const originalApiUrl = environment.apiUrl;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
  });

  it('debe crear la orden por POST y adaptar la respuesta', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: OrderResponse | undefined;

    service.createOrder(payload).subscribe((order) => (result = order));
    const request = httpMock.expectOne('https://api.test/orders');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ items: [{ oferta_id: 'of-1', cantidad: 1 }] });
    request.flush({
      id: 'o-1',
      estado: 'creada',
      total_cents: 5000,
      creado_en: '2026-10-07T00:00:00Z',
    });

    expect(result?.id).toBe('o-1');
    expect(result?.total).toBe(50);
    expect(result?.status).toBe('creada');
  });

  it('debe emitir un error cuando no hay apiUrl configurada', () => {
    environment.apiUrl = '';
    build();
    let error: Error | undefined;

    service.createOrder(payload).subscribe({ error: (err: Error) => (error = err) });

    expect(error?.message).toContain('apiUrl no configurado');
  });
});
