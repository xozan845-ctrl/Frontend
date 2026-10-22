import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InventoryService } from './inventory.service';
import { environment } from '../../../../../environments/environment';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InventoryService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
  });

  it('debe listar el inventario', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service.list().subscribe((lines) => (result = lines));

    const request = httpMock.expectOne('https://api.test/admin/inventario');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        sku: 'SKU-1',
        nombre: 'Teclado',
        stock: 10,
        disponible: 8,
        reservado: 2,
        estado: 'disponible',
        precio_base: '100.00',
        valor_disponible_cents: 80000,
        valor_total_cents: 100000,
      },
    ]);

    expect(result).toEqual([
      {
        sku: 'SKU-1',
        name: 'Teclado',
        stock: 10,
        available: 8,
        reserved: 2,
        status: 'disponible',
        basePrice: 100,
        availableValueCents: 80000,
        totalValueCents: 100000,
      },
    ]);
  });

  it('debe traducir el 403 de un rol no admin', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.list().subscribe({ error: (e: Error) => (error = e) });
    httpMock
      .expectOne('https://api.test/admin/inventario')
      .flush(
        { mensaje: 'Solo un administrador puede ver el inventario.' },
        { status: 403, statusText: 'Forbidden' },
      );

    expect(error?.message).toBe('Solo un administrador puede ver el inventario.');
  });

  it('debe emitir error cuando no hay apiUrl', () => {
    environment.apiUrl = '';
    build();
    let error: Error | undefined;

    service.list().subscribe({ error: (e: Error) => (error = e) });

    expect(error?.message).toContain('apiUrl no configurado');
  });
});
