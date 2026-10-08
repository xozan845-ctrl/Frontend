import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { CreateOrderPayload, OrderResponse, OrderTimelineEvent } from '../models/order.model';
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

  it('debe listar el historial de órdenes (GET /orders)', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: OrderResponse[] | undefined;

    service.getOrders().subscribe((orders) => (result = orders));
    const request = httpMock.expectOne('https://api.test/orders');
    expect(request.request.method).toBe('GET');
    request.flush([
      { id: 'o-1', estado: 'creada', total_cents: 5000, creado_en: '2026-10-07T00:00:00Z' },
    ]);

    expect(result).toHaveLength(1);
    expect(result?.[0].status).toBe('creada');
  });

  it('debe obtener el detalle de una orden con sus items (GET /orders/:id)', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: OrderResponse | undefined;

    service.getOrder('o-1').subscribe((order) => (result = order));
    httpMock.expectOne('https://api.test/orders/o-1').flush({
      id: 'o-1',
      estado: 'creada',
      total_cents: 5000,
      tienda_id: 't-1',
      items: [
        {
          oferta_id: 'of-1',
          cantidad: 2,
          producto_nombre: 'Teclado',
          sku: 'SKU-1',
          precio_unitario_cents: 2500,
          tienda_id: 't-1',
        },
      ],
    });

    expect(result?.storeId).toBe('t-1');
    expect(result?.items?.[0]).toMatchObject({
      name: 'Teclado',
      quantity: 2,
      unitPrice: 25,
    });
  });

  it('debe obtener el timeline de una orden (GET /orders/:id/timeline)', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: OrderTimelineEvent[] | undefined;

    service.getTimeline('o-1').subscribe((timeline) => (result = timeline));
    httpMock
      .expectOne('https://api.test/orders/o-1/timeline')
      .flush([
        { id: 1, tipo: 'orden.creada', payload: {}, version: 1, creado_en: '2026-10-07T00:00:00Z' },
      ]);

    expect(result).toHaveLength(1);
    expect(result?.[0].type).toBe('orden.creada');
  });

  it('debe emitir un error cuando no hay apiUrl configurada', () => {
    environment.apiUrl = '';
    build();
    let error: Error | undefined;

    service.createOrder(payload).subscribe({ error: (err: Error) => (error = err) });

    expect(error?.message).toContain('apiUrl no configurado');
  });
});
