import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ClientService } from './client.service';
import { environment } from '../../../../environments/environment';
import { Client } from '../models/vendor-order.model';

describe('ClientService', () => {
  let service: ClientService;
  let httpMock: HttpTestingController;

  const originalApiUrl = environment.apiUrl;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClientService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    environment.apiUrl = 'https://api.test';
  });

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
  });

  it('debe buscar clientes con el término (GET /vendedores/clientes?q=)', () => {
    build();
    let clients: unknown;

    service.searchClients('carla').subscribe((result) => (clients = result));

    const request = httpMock.expectOne('https://api.test/vendedores/clientes?q=carla');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('q')).toBe('carla');
    request.flush({ items: [{ id: 7, nombre: 'Carla López' }] });

    expect(clients).toEqual([{ id: '7', code: '', name: 'Carla López', phone: '', email: '' }]);
    httpMock.verify();
  });

  it('debe crear un cliente (POST /vendedores/clientes)', () => {
    build();
    let client: Client | undefined;

    service
      .createClient({ name: 'Nuevo Cliente', phone: '+505 1111 2222', email: 'nuevo@correo.com' })
      .subscribe((result) => (client = result));

    const request = httpMock.expectOne('https://api.test/vendedores/clientes');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombre: 'Nuevo Cliente',
      telefono: '+505 1111 2222',
      email: 'nuevo@correo.com',
    });
    request.flush({ data: { id: 'vc-9', codigo: 'CL-00009', nombre: 'Nuevo Cliente' } });

    expect(client?.code).toBe('CL-00009');
    expect(client?.email).toBe('');
    httpMock.verify();
  });

  it('debe degradar si la respuesta de creación no trae cliente interpretable', () => {
    build();
    let error: Error | undefined;

    service
      .createClient({ name: 'X', phone: '', email: '' })
      .subscribe({ error: (err: Error) => (error = err) });
    httpMock.expectOne('https://api.test/vendedores/clientes').flush({ sin: 'id' });

    expect(error?.message).toBe('No se pudo interpretar el cliente creado.');
  });

  it('debe traducir el fallo del listado a un mensaje de negocio', () => {
    build();
    let error: Error | undefined;

    service.searchClients('').subscribe({ error: (err: Error) => (error = err) });
    httpMock
      .expectOne('https://api.test/vendedores/clientes?q=')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(error?.message).toBe('No se pudieron cargar los clientes.');
  });

  it('debe exigir apiUrl configurada cuando el entorno no define backend', () => {
    environment.apiUrl = '';
    build();
    const errors: string[] = [];

    service.searchClients('x').subscribe({ error: (err: Error) => errors.push(err.message) });
    service
      .createClient({ name: 'X', phone: '', email: '' })
      .subscribe({ error: (err: Error) => errors.push(err.message) });

    expect(errors).toHaveLength(2);
    expect(errors.every((message) => message.includes('apiUrl no configurado'))).toBe(true);
  });
});
