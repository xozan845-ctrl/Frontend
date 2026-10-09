import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CartService } from './cart.service';
import { CartItem } from '../models/cart.model';
import { environment } from '../../../../environments/environment';

const cartResponse = {
  items: [
    {
      oferta_id: 'of-1',
      cantidad: 2,
      producto_nombre: 'Teclado',
      precio_venta: '100.00',
      sku: 'SKU-1',
      stock: 5,
    },
  ],
};

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;

  const originalApiUrl = environment.apiUrl;
  const originalDataSource = environment.apiConfig.dataSource;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
    environment.apiConfig.dataSource = originalDataSource;
  });

  it('debe obtener el carrito (GET /carrito)', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: CartItem[] | undefined;

    service.getCart().subscribe((items) => (result = items));
    httpMock.expectOne('https://api.test/carrito').flush(cartResponse);

    expect(result).toHaveLength(1);
    expect(result?.[0]).toMatchObject({ quantity: 2 });
    expect(result?.[0].product).toMatchObject({ id: 'of-1', name: 'Teclado', price: 100 });
  });

  it('debe añadir un item (POST /carrito/items)', () => {
    environment.apiUrl = 'https://api.test';
    build();

    service.addItem('of-1', 2).subscribe();
    const request = httpMock.expectOne('https://api.test/carrito/items');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ oferta_id: 'of-1', cantidad: 2 });
    request.flush(cartResponse);
  });

  it('debe actualizar la cantidad (PATCH /carrito/items/:id)', () => {
    environment.apiUrl = 'https://api.test';
    build();

    service.updateQuantity('of-1', 3).subscribe();
    const request = httpMock.expectOne('https://api.test/carrito/items/of-1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ cantidad: 3 });
    request.flush(cartResponse);
  });

  it('debe eliminar un item (DELETE /carrito/items/:id)', () => {
    environment.apiUrl = 'https://api.test';
    build();

    service.removeItem('of-1').subscribe();
    const request = httpMock.expectOne('https://api.test/carrito/items/of-1');
    expect(request.request.method).toBe('DELETE');
    request.flush({ items: [] });
  });

  it('debe vaciar el carrito (DELETE /carrito)', () => {
    environment.apiUrl = 'https://api.test';
    build();

    service.clearCart().subscribe();
    const request = httpMock.expectOne('https://api.test/carrito');
    expect(request.request.method).toBe('DELETE');
    request.flush({ items: [] });
  });

  it('debe simular el carrito en modo mock', async () => {
    environment.apiConfig.dataSource = 'mock';
    build();

    let result: CartItem[] | undefined;
    service.addItem('of-9', 1).subscribe((items) => (result = items));
    await vi.waitFor(() => expect(result).toHaveLength(1));

    expect(result?.[0].quantity).toBe(1);
    httpMock.expectNone(() => true);
  });

  it('debe emitir un error cuando no hay apiUrl configurada', () => {
    environment.apiUrl = '';
    build();
    let error: Error | undefined;

    service.getCart().subscribe({ error: (err: Error) => (error = err) });

    expect(error?.message).toContain('apiUrl no configurado');
  });

  it('debe obtener un carrito vacío en modo mock', async () => {
    environment.apiConfig.dataSource = 'mock';
    build();
    let result: CartItem[] | undefined;

    service.getCart().subscribe((items) => (result = items));

    await vi.waitFor(() => expect(result).toEqual([]));
    httpMock.expectNone(() => true);
  });

  it('debe fusionar la cantidad de un item existente en modo mock', async () => {
    environment.apiConfig.dataSource = 'mock';
    build();
    let result: CartItem[] | undefined;

    service.addItem('of-9', 1).subscribe();
    service.addItem('of-9', 2).subscribe((items) => (result = items));

    await vi.waitFor(() => expect(result?.[0].quantity).toBe(3));
  });

  it('debe actualizar y eliminar items en modo mock', async () => {
    environment.apiConfig.dataSource = 'mock';
    build();
    let afterUpdate: CartItem[] | undefined;
    let afterRemove: CartItem[] | undefined;

    service.addItem('of-1', 1).subscribe();
    service.updateQuantity('of-1', 5).subscribe((items) => (afterUpdate = items));
    await vi.waitFor(() => expect(afterUpdate?.[0].quantity).toBe(5));

    service.updateQuantity('of-1', 0).subscribe((items) => (afterRemove = items));
    await vi.waitFor(() => expect(afterRemove).toEqual([]));
  });

  it('debe eliminar y vaciar el carrito en modo mock', async () => {
    environment.apiConfig.dataSource = 'mock';
    build();
    let afterRemove: CartItem[] | undefined;
    let afterClear: CartItem[] | undefined;

    service.addItem('of-1', 1).subscribe();
    service.removeItem('of-1').subscribe((items) => (afterRemove = items));
    await vi.waitFor(() => expect(afterRemove).toEqual([]));

    service.addItem('of-2', 1).subscribe();
    service.clearCart().subscribe((items) => (afterClear = items));
    await vi.waitFor(() => expect(afterClear).toEqual([]));
  });

  it('debe emitir error de las mutaciones cuando no hay apiUrl', () => {
    environment.apiUrl = '';
    build();
    const errors: Error[] = [];

    service.addItem('of-1', 1).subscribe({ error: (e: Error) => errors.push(e) });
    service.updateQuantity('of-1', 1).subscribe({ error: (e: Error) => errors.push(e) });
    service.removeItem('of-1').subscribe({ error: (e: Error) => errors.push(e) });
    service.clearCart().subscribe({ error: (e: Error) => errors.push(e) });

    expect(errors).toHaveLength(4);
    errors.forEach((e) => expect(e.message).toContain('apiUrl no configurado'));
  });
});
