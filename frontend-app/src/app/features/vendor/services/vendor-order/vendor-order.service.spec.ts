import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VendorOrderService } from './vendor-order.service';
import { environment } from '../../../../../environments/environment';
import { CreateOrderPayload, VendorOrder } from '../../models/vendor-order.model';

describe('VendorOrderService', () => {
  let service: VendorOrderService;
  let httpMock: HttpTestingController;

  const originalApiUrl = environment.apiUrl;

  /** Un pedido de 2 × vp-1 (180) + 1 × vp-2 (220) + 3 × vp-3 (195) = 1165 → 1339.75 con IVA. */
  const payload: CreateOrderPayload = {
    clientId: 'vc-1',
    storeId: 'tienda-demo',
    date: '2026-10-15',
    deliveryMethod: 'retiro_tienda',
    discountPercent: 0,
    observations: 'Entregar por la tarde',
    items: [
      { productId: 'vp-1', quantity: 2 },
      { productId: 'vp-2', quantity: 1 },
      { productId: 'vp-3', quantity: 3 },
    ],
  };

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VendorOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    environment.apiUrl = 'https://api.test';
  });

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
  });

  it('debe listar los pedidos normalizados (GET /vendedores/pedidos)', () => {
    build();
    let orders: unknown;

    service.listOrders().subscribe((result) => (orders = result));

    const request = httpMock.expectOne('https://api.test/vendedores/pedidos');
    expect(request.request.method).toBe('GET');
    request.flush({
      data: [{ id: 1, cliente_nombre: 'Carla', estado: 'Completado', total: '115.5' }],
    });

    expect(orders).toEqual([
      {
        id: '1',
        clientId: null,
        clientName: 'Carla',
        createdAt: '',
        status: 'completado',
        total: 115.5,
        lines: [],
        notes: '',
      },
    ]);
    httpMock.verify();
  });

  it('debe obtener el detalle de un pedido (GET /vendedores/pedidos/:id)', () => {
    build();
    let order: unknown;

    service.getOrder('PED-000125').subscribe((result) => (order = result));

    const request = httpMock.expectOne('https://api.test/vendedores/pedidos/PED-000125');
    expect(request.request.method).toBe('GET');
    request.flush({ data: { id: 'PED-000125', estado: 'en proceso', total: 1339.75 } });

    expect(order).toMatchObject({ id: 'PED-000125', status: 'en_proceso', total: 1339.75 });
    httpMock.verify();
  });

  it('debe registrar el pedido con el payload en snake_case (POST)', () => {
    build();
    let created: VendorOrder | undefined;

    service.createOrder(payload).subscribe((order) => (created = order));

    const request = httpMock.expectOne('https://api.test/vendedores/pedidos');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      cliente_id: 'vc-1',
      tienda_id: 'tienda-demo',
      fecha: '2026-10-15',
      metodo_entrega: 'retiro_tienda',
      descuento: 0,
      observaciones: 'Entregar por la tarde',
      items: [
        { producto_id: 'vp-1', cantidad: 2 },
        { producto_id: 'vp-2', cantidad: 1 },
        { producto_id: 'vp-3', cantidad: 3 },
      ],
    });
    request.flush({ data: { id: 'PED-000126', estado: 'pendiente', total: 1339.75 } });

    expect(created?.id).toBe('PED-000126');
    expect(created?.status).toBe('pendiente');
    httpMock.verify();
  });

  it('debe cambiar el estado del pedido (PATCH .../:id/estado)', () => {
    build();
    let updated: unknown;

    service.updateStatus('PED-000123', 'completado').subscribe((order) => (updated = order));

    const request = httpMock.expectOne('https://api.test/vendedores/pedidos/PED-000123/estado');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ estado: 'completado' });
    request.flush({ data: { id: 'PED-000123', estado: 'completado' } });

    expect(updated).toMatchObject({ id: 'PED-000123', status: 'completado' });
    httpMock.verify();
  });

  it('debe degradar si la respuesta no trae un pedido interpretable', () => {
    build();
    let error: Error | undefined;

    service.getOrder('PED-1').subscribe({ error: (err: Error) => (error = err) });
    httpMock.expectOne('https://api.test/vendedores/pedidos/PED-1').flush({ sin: 'id' });

    expect(error?.message).toBe('No se pudo interpretar el pedido.');
  });

  it('debe traducir los errores HTTP a mensajes de negocio', () => {
    build();
    const errors: string[] = [];

    service.listOrders().subscribe({ error: (err: Error) => errors.push(err.message) });
    httpMock
      .expectOne('https://api.test/vendedores/pedidos')
      .flush({}, { status: 403, statusText: 'Forbidden' });

    service
      .updateStatus('PED-1', 'cancelado')
      .subscribe({ error: (err: Error) => errors.push(err.message) });
    httpMock
      .expectOne('https://api.test/vendedores/pedidos/PED-1/estado')
      .flush({}, { status: 500, statusText: 'Server Error' });

    service.createOrder(payload).subscribe({ error: (err: Error) => errors.push(err.message) });
    httpMock
      .expectOne('https://api.test/vendedores/pedidos')
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(errors).toEqual([
      'Necesitas una cuenta de vendedor para esta acción.',
      'No se pudo actualizar el pedido.',
      'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
    ]);
  });

  it('debe exigir apiUrl configurada cuando el entorno no define backend', () => {
    environment.apiUrl = '';
    build();
    const errors: string[] = [];

    service.listOrders().subscribe({ error: (err: Error) => errors.push(err.message) });
    service.getOrder('PED-1').subscribe({ error: (err: Error) => errors.push(err.message) });
    service.createOrder(payload).subscribe({ error: (err: Error) => errors.push(err.message) });
    service
      .updateStatus('PED-1', 'completado')
      .subscribe({ error: (err: Error) => errors.push(err.message) });

    expect(errors).toHaveLength(4);
    expect(errors.every((message) => message.includes('apiUrl no configurado'))).toBe(true);
  });
});
