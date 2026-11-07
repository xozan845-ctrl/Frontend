import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../../environments/environment';
import { MediaBackgroundDraft } from '@core/models/media-background.model';
import { MediaBackgroundWriteService } from './media-background-write.service';

const draft: MediaBackgroundDraft = {
  objectId: 'obj-1',
  posterObjectId: 'poster-1',
  alt: 'Fondo',
  overlay: 45,
  position: 'top',
  active: true,
};

describe('MediaBackgroundWriteService', () => {
  let service: MediaBackgroundWriteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MediaBackgroundWriteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('actualiza el fondo de plataforma con el prefijo background_*', () => {
    let result: unknown;
    service.updateSite('platform', draft).subscribe((config) => (result = config));

    const request = httpMock.expectOne(`${environment.apiUrl}/configuracion/sitio`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      background_objeto_id: 'obj-1',
      background_poster_objeto_id: 'poster-1',
      background_alt: 'Fondo',
      background_overlay: 45,
      background_position: 'top',
      background_activo: true,
    });
    request.flush({
      background_objeto_id: 'obj-1',
      background_media_type: 'video',
      background_url: '/api/v1/storage/public/objetos/obj-1',
      background_activo: true,
    });
    expect(result).toMatchObject({ objectId: 'obj-1', mediaType: 'video', active: true });
  });

  it('actualiza el panel de IA con el prefijo panel_ai_background_*', () => {
    let result: unknown;
    service.updateSite('panel-ai', draft).subscribe((config) => (result = config));

    const request = httpMock.expectOne(`${environment.apiUrl}/configuracion/sitio`);
    expect(request.request.body).toEqual({
      panel_ai_background_objeto_id: 'obj-1',
      panel_ai_background_poster_objeto_id: 'poster-1',
      panel_ai_background_alt: 'Fondo',
      panel_ai_background_overlay: 45,
      panel_ai_background_position: 'top',
      panel_ai_background_activo: true,
    });
    request.flush({
      panel_ai_background_objeto_id: 'obj-1',
      panel_ai_background_media_type: 'video',
      panel_ai_background_url: '/api/v1/storage/public/objetos/obj-1',
      panel_ai_background_activo: true,
    });
    expect(result).toMatchObject({ objectId: 'obj-1', mediaType: 'video', active: true });
  });

  it('actualiza el fondo de empresa y de tienda en sus endpoints', () => {
    service.updateCompany('e-1', draft).subscribe();
    const empresa = httpMock.expectOne(`${environment.apiUrl}/empresas/e-1/perfil`);
    expect(empresa.request.method).toBe('PATCH');
    expect(empresa.request.body).toMatchObject({ background_objeto_id: 'obj-1' });
    empresa.flush({ background_objeto_id: 'obj-1', background_activo: true });

    service.updateStore('t-1', draft).subscribe();
    const tienda = httpMock.expectOne(`${environment.apiUrl}/tiendas/t-1/background`);
    expect(tienda.request.method).toBe('PATCH');
    expect(tienda.request.body).toMatchObject({ background_objeto_id: 'obj-1' });
    tienda.flush({ background_objeto_id: 'obj-1', background_activo: true });
  });

  it('traduce un error del backend a un mensaje de usuario', () => {
    const errors: string[] = [];
    service.updateStore('t-1', draft).subscribe({
      error: (error: Error) => errors.push(error.message),
    });
    const request = httpMock.expectOne(`${environment.apiUrl}/tiendas/t-1/background`);
    request.flush({ mensaje: 'Solo el dueño' }, { status: 403, statusText: 'Forbidden' });

    expect(errors[0]).toBeTruthy();
  });
});
