import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CompanyInvitationService } from './company-invitation.service';
import { environment } from '../../../../../environments/environment';

describe('CompanyInvitationService', () => {
  let service: CompanyInvitationService;
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CompanyInvitationService);
    httpMock = TestBed.inject(HttpTestingController);
    environment.apiUrl = 'https://api.test';
  });

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('genera una invitación con tienda y participación', () => {
    let result: unknown;
    service
      .create('c-1', { email: 'v@test', storeId: 't-1', participationPercentage: 25 })
      .subscribe((value) => (result = value));
    const request = httpMock.expectOne('https://api.test/empresas/c-1/invitaciones/vendedores');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      correo: 'v@test',
      tienda_id: 't-1',
      participacion_porcentaje: 25,
    });
    request.flush({
      id: 'i-1',
      empresa_id: 'c-1',
      tienda_id: 't-1',
      tienda_nombre: 'Centro',
      correo: 'v@test',
      participacion_porcentaje: 25,
      estado: 'pendiente',
      expira_en: '2026-10-26',
      url_invitacion: 'https://app.test/invite',
    });
    expect(result).toMatchObject({ id: 'i-1', invitationUrl: 'https://app.test/invite' });
  });

  it('consulta y acepta una invitación pública', () => {
    service.getPublic('token').subscribe();
    httpMock.expectOne('https://api.test/invitaciones/vendedores/token').flush({
      valida: true,
      correo: 'v@test',
      empresa_nombre: 'Empresa',
      tienda_nombre: 'Centro',
      participacion_porcentaje: 25,
      expira_en: '2026-10-26',
    });
    service.accept('token', { name: 'Ana', password: 'secreto123' }).subscribe();
    const request = httpMock.expectOne('https://api.test/invitaciones/vendedores/token/aceptar');
    expect(request.request.body).toEqual({ nombre: 'Ana', contrasena: 'secreto123' });
    request.flush({
      access_token: 'a',
      refresh_token: 'r',
      usuario: { id: 'v-1', nombre: 'Ana', correo: 'v@test', rol: 'vendedor' },
    });
  });
});
