import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../../environments/environment';
import { MediaBackgroundService } from './media-background.service';

describe('MediaBackgroundService', () => {
  let service: MediaBackgroundService;
  let httpMock: HttpTestingController;

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MediaBackgroundService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    setup();
  });

  afterEach(() => httpMock.verify());

  it('debe pedir la configuración pública de plataforma', () => {
    let result: unknown;
    service.platform().subscribe((config) => (result = config));

    const request = httpMock.expectOne(`${environment.apiUrl}/configuracion/sitio`);
    expect(request.request.method).toBe('GET');
    request.flush({
      background_objeto_id: 'bg-1',
      background_media_type: 'imagen',
      background_url: '/api/v1/storage/public/objetos/bg-1',
      background_activo: true,
    });

    expect(result).toMatchObject({
      objectId: 'bg-1',
      mediaType: 'imagen',
      active: true,
    });
  });

  it('debe pedir el bloque panel_ai de la configuración del sitio', () => {
    let result: unknown;
    service.panelAi().subscribe((config) => (result = config));

    const request = httpMock.expectOne(`${environment.apiUrl}/configuracion/sitio`);
    expect(request.request.method).toBe('GET');
    request.flush({
      background_objeto_id: 'bg-site',
      panel_ai_background_objeto_id: 'ai-1',
      panel_ai_background_media_type: 'video',
      panel_ai_background_url: '/api/v1/storage/public/objetos/ai-1',
      panel_ai_background_activo: true,
    });

    expect(result).toMatchObject({
      objectId: 'ai-1',
      mediaType: 'video',
      active: true,
    });
  });

  it('debe pedir el fondo de una empresa', () => {
    let result: unknown;
    service.company('empresa 1').subscribe((config) => (result = config));

    const request = httpMock.expectOne(`${environment.apiUrl}/empresas/empresa%201`);
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'empresa 1',
      background_objeto_id: 'bg-2',
      background_media_type: 'video',
      background_url: '/api/v1/storage/public/objetos/bg-2',
      background_activo: true,
    });

    expect(result).toMatchObject({ objectId: 'bg-2', mediaType: 'video' });
  });

  it('debe pedir el storefront público de una tienda', () => {
    let result: unknown;
    service.store('tienda-1').subscribe((config) => (result = config));

    const request = httpMock.expectOne(`${environment.apiUrl}/tiendas/tienda-1`);
    expect(request.request.method).toBe('GET');
    request.flush({
      tienda: {
        id: 'tienda-1',
        background_objeto_id: 'bg-3',
        background_media_type: 'imagen',
        background_url: '/api/v1/storage/public/objetos/bg-3',
        background_activo: true,
      },
      ofertas: [],
    });

    expect(result).toMatchObject({ objectId: 'bg-3', mediaType: 'imagen' });
  });

  it('debe fallar con un mensaje claro si no hay apiUrl', () => {
    const original = environment.apiUrl;
    environment.apiUrl = '';
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const withoutApi = TestBed.inject(MediaBackgroundService);
    const errors: string[] = [];

    try {
      withoutApi.platform().subscribe({ error: (err: Error) => errors.push(err.message) });
    } finally {
      environment.apiUrl = original;
    }

    expect(errors[0]).toContain('apiUrl no configurado');
    httpMock = TestBed.inject(HttpTestingController);
  });
});
