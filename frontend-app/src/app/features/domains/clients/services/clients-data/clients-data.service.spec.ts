import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ClientsHttpDataSource } from './clients-data.service';
import { environment } from '../../../../../../environments/environment';
import { CLIENTS_SCOPE_CONFIG } from '../../../../../shared/clients/constants/clients-config.tokens';
import { AuthStore } from '../../../../applications/auth/public-api';

const userId = signal<string | number>('vendedor-1');
const tenantId = signal<string | null>('empresa-1');
const authStore = {
  user: computed(() => ({
    id: userId(),
    email: 'user@test.com',
    name: 'User',
    tenantId: tenantId(),
  })),
};

describe('ClientsHttpDataSource', () => {
  let service: ClientsHttpDataSource;
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;

  const build = (scope: 'company' | 'vendor', ordersPath = '/empresa') => {
    TestBed.configureTestingModule({
      providers: [
        ClientsHttpDataSource,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthStore, useValue: authStore },
        { provide: CLIENTS_SCOPE_CONFIG, useValue: { scope, ordersPath } },
      ],
    });
    service = TestBed.inject(ClientsHttpDataSource);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    environment.apiUrl = 'https://api.test';
    userId.set('vendedor-1');
    tenantId.set('empresa-1');
  });

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
    httpMock?.verify();
  });

  it('debe consultar las órdenes de empresa y normalizarlas', () => {
    build('company');
    let result: unknown;

    service.orders().subscribe((orders) => (result = orders));

    const request = httpMock.expectOne('https://api.test/orders/empresa');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'o-1',
        comprador_id: 'buyer-1',
        estado: 'pagada',
        total_cents: 35000,
        creado_en: '2026-10-20T12:00:00.000Z',
      },
    ]);

    expect(result).toEqual([
      {
        id: 'o-1',
        buyerId: 'buyer-1',
        status: 'pagada',
        total: 350,
        createdAt: '2026-10-20T12:00:00.000Z',
      },
    ]);
  });

  it('debe consultar las ventas del vendedor y aislar su storage', () => {
    build('vendor', '/vendedor/mis-ventas');

    service.orders().subscribe();
    httpMock.expectOne('https://api.test/orders/vendedor/mis-ventas').flush([]);
    expect(service.storageKey()).toBe('ecom_vendor_clients_vendedor-1');

    userId.set(42);
    expect(service.storageKey()).toBe('ecom_vendor_clients_42');
  });

  it('debe usar el tenant para el storage de empresa', () => {
    build('company');
    expect(service.storageKey()).toBe('ecom_company_clients_empresa-1');

    tenantId.set(null);
    expect(service.storageKey()).toBe('ecom_company_clients_default');
  });

  it('debe traducir el fallo a un mensaje de negocio', () => {
    build('company');
    let error: Error | undefined;

    service.orders().subscribe({ error: (err: Error) => (error = err) });
    httpMock
      .expectOne('https://api.test/orders/empresa')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(error?.message).toBe('No se pudieron cargar los clientes.');
  });

  it('debe exigir apiUrl configurada', () => {
    environment.apiUrl = '';
    build('company');
    let error: Error | undefined;

    service.orders().subscribe({ error: (err: Error) => (error = err) });

    expect(error?.message).toContain('apiUrl no configurado');
  });
});
