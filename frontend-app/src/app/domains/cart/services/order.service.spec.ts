import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { CreateOrderPayload, OrderResponse } from '../models/order.model';
import { environment } from '../../../../environments/environment';

const payload: CreateOrderPayload = {
  items: [{ productId: 1, name: 'Teclado', price: 50, quantity: 1 }],
  shipping: {
    fullName: 'Ana',
    email: 'ana@tienda.com',
    address: 'Calle 1',
    city: 'Ciudad',
    zipCode: '12345',
    phone: '5555555555',
  },
  payment: { cardName: 'Ana', cardNumber: '****-****-****-1234', expiry: '12/30', last4: '1234' },
  total: 50,
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
    expect(request.request.body).toBe(payload);
    request.flush({ id: 'o-1', orderNumber: 'ORD-1', status: 'confirmed', total: 50 });

    expect(result?.orderNumber).toBe('ORD-1');
  });

  it('debe emitir un error cuando no hay apiUrl configurada', () => {
    environment.apiUrl = '';
    build();
    let error: Error | undefined;

    service.createOrder(payload).subscribe({ error: (err: Error) => (error = err) });

    expect(error?.message).toContain('apiUrl no configurado');
  });
});
