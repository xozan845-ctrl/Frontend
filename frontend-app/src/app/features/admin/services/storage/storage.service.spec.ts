import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StorageService } from './storage.service';
import { environment } from '../../../../../environments/environment';
import { STORAGE_TENANTS_FIXTURE } from '../../adapters/fixtures/storage.fixture';

describe('StorageService', () => {
  let service: StorageService;
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StorageService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
  });

  it('debe listar tenants de almacenamiento', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service.list().subscribe((page) => (result = page));

    httpMock.expectOne('https://api.test/admin/storage/tenants').flush({
      items: STORAGE_TENANTS_FIXTURE,
      total: 2,
      pagina: 1,
      limite: 20,
      paginas: 1,
    });

    expect(result).toMatchObject({ total: 2, page: 1, limit: 20 });
  });

  it('debe ajustar cuota y estado con PATCH', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service
      .update('tenant-1', { quotaBytes: 6442450944, status: 'suspendido' })
      .subscribe((tenant) => (result = tenant));

    const request = httpMock.expectOne('https://api.test/admin/storage/tenants/tenant-1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ cuota_bytes: 6442450944, estado: 'suspendido' });
    request.flush({ ...STORAGE_TENANTS_FIXTURE[0], cuota_bytes: 6442450944, estado: 'suspendido' });

    expect(result).toMatchObject({ tenantId: 'tenant-1', status: 'suspendido' });
  });

  it('debe recalcular el uso con POST', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: unknown;

    service.recalculate('tenant-1').subscribe((tenant) => (result = tenant));

    const request = httpMock.expectOne(
      'https://api.test/admin/storage/tenants/tenant-1/recalcular',
    );
    expect(request.request.method).toBe('POST');
    request.flush(STORAGE_TENANTS_FIXTURE[0]);

    expect(result).toMatchObject({ tenantId: 'tenant-1' });
  });

  it('debe traducir errores y fallar sin apiUrl', () => {
    environment.apiUrl = 'https://api.test';
    build();
    const errors: Error[] = [];

    service.list().subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/admin/storage/tenants')
      .flush({ mensaje: 'Sin permiso.' }, { status: 403, statusText: 'Forbidden' });

    service
      .update('tenant-1', { status: 'activo' })
      .subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/admin/storage/tenants/tenant-1')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(errors[0].message).toBe('Sin permiso.');
    expect(errors[1].message).toBe('No se pudo actualizar el almacenamiento.');

    environment.apiUrl = '';
    const missing: Error[] = [];
    service.list().subscribe({ error: (e: Error) => missing.push(e) });
    service.recalculate('tenant-1').subscribe({ error: (e: Error) => missing.push(e) });

    expect(missing).toHaveLength(2);
    missing.forEach((error) => expect(error.message).toContain('apiUrl no configurado'));
  });
});
