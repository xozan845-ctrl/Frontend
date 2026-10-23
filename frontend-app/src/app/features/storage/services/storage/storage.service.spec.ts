import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StorageService } from './storage.service';
import { environment } from '../../../../../environments/environment';
import {
  BUCKET_FIXTURE,
  DOWNLOAD_FIXTURE,
  OBJECTS_FIXTURE,
  PRESIGNED_FIXTURE,
} from '../../adapters/fixtures/storage.fixture';

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
    vi.unstubAllGlobals();
  });

  it('debe cargar bucket y objetos', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let bucket: unknown;
    let page: unknown;

    service.bucket().subscribe((value) => (bucket = value));
    service.objects().subscribe((value) => (page = value));

    httpMock.expectOne('https://api.test/storage/bucket').flush(BUCKET_FIXTURE);
    httpMock.expectOne('https://api.test/storage/objetos').flush({
      items: OBJECTS_FIXTURE,
      total: 2,
      pagina: 1,
      limite: 20,
      paginas: 1,
    });

    expect(bucket).toMatchObject({ bucket: 't-tenant-1' });
    expect(page).toMatchObject({ total: 2 });
  });

  it('debe solicitar y confirmar una subida', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let upload: unknown;
    let object: unknown;

    service
      .requestUpload({ name: 'nuevo.png', contentType: 'image/png', sizeBytes: 1024 })
      .subscribe((value) => (upload = value));

    const request = httpMock.expectOne('https://api.test/storage/subidas');
    expect(request.request.body).toEqual({
      nombre: 'nuevo.png',
      content_type: 'image/png',
      tamano_bytes: 1024,
    });
    request.flush(PRESIGNED_FIXTURE);

    service.confirm('objeto-3').subscribe((value) => (object = value));
    httpMock
      .expectOne('https://api.test/storage/objetos/objeto-3/confirmar')
      .flush({ ...OBJECTS_FIXTURE[0], id: 'objeto-3', nombre: 'nuevo.png' });

    expect(upload).toMatchObject({ objectId: 'objeto-3' });
    expect(object).toMatchObject({ id: 'objeto-3', status: 'activo' });
  });

  it('debe subir el archivo con fetch y descargar/eliminar', async () => {
    environment.apiUrl = 'https://api.test';
    build();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['hola'], 'nuevo.png', { type: 'image/png' });
    let downloaded: unknown;

    await new Promise<void>((resolve, reject) => {
      service
        .uploadToUrl(PRESIGNED_FIXTURE.url_subida, { 'Content-Type': 'image/png' }, file)
        .subscribe({ next: () => resolve(), error: reject });
    });
    expect(fetchMock).toHaveBeenCalledWith(
      PRESIGNED_FIXTURE.url_subida,
      expect.objectContaining({ method: 'PUT', body: file }),
    );

    service.download('objeto-1').subscribe((value) => (downloaded = value));
    httpMock
      .expectOne('https://api.test/storage/objetos/objeto-1/descarga')
      .flush(DOWNLOAD_FIXTURE);

    service.delete('objeto-1').subscribe();
    httpMock
      .expectOne('https://api.test/storage/objetos/objeto-1')
      .flush(null, { status: 204, statusText: 'No Content' });

    expect(downloaded).toMatchObject({ name: 'foto.png' });
  });

  it('debe traducir errores de subida, confirmación, descarga y borrado', () => {
    environment.apiUrl = 'https://api.test';
    build();
    const errors: Error[] = [];

    service
      .requestUpload({ name: 'x', contentType: 'image/png', sizeBytes: 1 })
      .subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/storage/subidas')
      .flush({ mensaje: 'Cuota excedida.' }, { status: 409, statusText: 'Conflict' });

    service.confirm('objeto-1').subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/storage/objetos/objeto-1/confirmar')
      .flush({}, { status: 500, statusText: 'Server Error' });

    service.download('objeto-1').subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/storage/objetos/objeto-1/descarga')
      .flush({}, { status: 404, statusText: 'Not Found' });

    service.delete('objeto-1').subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/storage/objetos/objeto-1')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(errors[0].message).toBe('Cuota excedida.');
    expect(errors[1].message).toBe('No se pudo confirmar el archivo.');
    expect(errors[2].message).toBe('No se pudo descargar el archivo.');
    expect(errors[3].message).toBe('No se pudo eliminar el archivo.');
  });

  it('debe fallar si el PUT prefirmado responde error', async () => {
    environment.apiUrl = 'https://api.test';
    build();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(
      new Promise<void>((resolve, reject) => {
        service
          .uploadToUrl('/subida', {}, new File(['x'], 'x.png', { type: 'image/png' }))
          .subscribe({ next: resolve, error: reject });
      }),
    ).rejects.toThrow('La subida falló con estado 500.');
  });

  it('debe traducir errores y fallar sin apiUrl', () => {
    environment.apiUrl = 'https://api.test';
    build();
    const errors: Error[] = [];

    service.bucket().subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/storage/bucket')
      .flush({ mensaje: 'Sin bucket.' }, { status: 404, statusText: 'Not Found' });

    service.objects().subscribe({ error: (e: Error) => errors.push(e) });
    httpMock
      .expectOne('https://api.test/storage/objetos')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(errors[0].message).toBe('Sin bucket.');
    expect(errors[1].message).toBe('No se pudieron cargar los objetos.');

    environment.apiUrl = '';
    const missing: Error[] = [];
    service.bucket().subscribe({ error: (e: Error) => missing.push(e) });
    service.confirm('objeto-1').subscribe({ error: (e: Error) => missing.push(e) });
    expect(missing).toHaveLength(2);
    missing.forEach((error) => expect(error.message).toContain('apiUrl no configurado'));
  });
});
