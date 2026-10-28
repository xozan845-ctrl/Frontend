import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CompanyInvitationService, normalizeInvitationUrl } from './company-invitation.service';
import { environment } from '../../../../../../environments/environment';

describe('CompanyInvitationService', () => {
  let service: CompanyInvitationService;
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;
  const originalDataSource = environment.apiConfig.dataSource;

  beforeEach(() => {
    environment.apiUrl = 'https://api.test';
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CompanyInvitationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
    environment.apiConfig.dataSource = originalDataSource;
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

  it('reemplaza el origen loopback y convierte el enlace antiguo a la ruta corta', () => {
    expect(
      normalizeInvitationUrl(
        'http://localhost:5173/registro/vendedor?token=abc#inicio',
        'https://kb-coleccion-internacional-ni.web.app/',
      ),
    ).toBe('https://kb-coleccion-internacional-ni.web.app/i/abc#inicio');
    expect(
      normalizeInvitationUrl(
        'http://127.0.0.1:5173/registro/vendedor?token=abc',
        'https://kb-coleccion-internacional-ni.web.app',
      ),
    ).toBe('https://kb-coleccion-internacional-ni.web.app/i/abc');
  });

  it('funciona en desarrollo y conserva enlaces ya cortos', () => {
    expect(
      normalizeInvitationUrl(
        'http://localhost:5173/registro/vendedor?token=abc',
        'http://localhost:4200',
      ),
    ).toBe('http://localhost:4200/i/abc');
    expect(normalizeInvitationUrl('http://localhost:5173/i/abc', 'http://localhost:4200')).toBe(
      'http://localhost:4200/i/abc',
    );
    expect(
      normalizeInvitationUrl(
        'https://kb-coleccion-internacional-ni.web.app/i/abc',
        'https://app.test',
      ),
    ).toBe('https://kb-coleccion-internacional-ni.web.app/i/abc');
    expect(normalizeInvitationUrl('not-a-url', 'https://app.test')).toBe('not-a-url');
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

  it('usa el flujo mock para generar una invitación', async () => {
    environment.apiConfig.dataSource = 'mock';

    let result: unknown;
    service
      .create('c-1', { email: 'v@test', storeId: 't-1', participationPercentage: 25 })
      .subscribe((value) => (result = value));

    await vi.waitFor(() => expect(result).toMatchObject({ companyId: 'c-1', status: 'pendiente' }));

    let listed: unknown;
    service.list('c-1').subscribe((value) => (listed = value));
    await vi.waitFor(() => expect(listed).toEqual({ sellers: [], invitations: [] }));

    let revoked: unknown;
    service.revoke('c-1', 'i-1').subscribe((value) => (revoked = value));
    await vi.waitFor(() => expect(revoked).toBe(true));
  });

  it('lista, revoca y traduce errores del backend', () => {
    let listResult: unknown;
    service.list('c-1').subscribe((value) => (listResult = value));
    httpMock.expectOne('https://api.test/empresas/c-1/vendedores').flush({
      vendedores: [],
      invitaciones: [],
    });
    expect(listResult).toEqual({ sellers: [], invitations: [] });

    let revoked: unknown;
    service.revoke('c-1', 'i-1').subscribe((value) => (revoked = value));
    httpMock.expectOne('https://api.test/empresas/c-1/invitaciones/vendedores/i-1').flush({});
    expect(revoked).toBe(true);

    let error: Error | undefined;
    service
      .create('c-1', { email: 'v@test', storeId: 't-1', participationPercentage: 25 })
      .subscribe({
        error: (value: Error) => (error = value),
      });
    httpMock
      .expectOne('https://api.test/empresas/c-1/invitaciones/vendedores')
      .flush({ mensaje: 'Correo ya registrado.' }, { status: 409, statusText: 'Conflict' });
    expect(error?.message).toBe('Correo ya registrado.');
  });

  it('rechaza una invitación pública inválida y errores de aceptación', () => {
    let publicError: Error | undefined;
    service.getPublic('expired').subscribe({ error: (value: Error) => (publicError = value) });
    httpMock.expectOne('https://api.test/invitaciones/vendedores/expired').flush({ valida: false });
    expect(publicError?.message).toBe('La invitación no es válida.');

    let acceptError: Error | undefined;
    service.accept('expired', { name: 'Ana', password: 'secreto123' }).subscribe({
      error: (value: Error) => (acceptError = value),
    });
    httpMock
      .expectOne('https://api.test/invitaciones/vendedores/expired/aceptar')
      .flush({ mensaje: 'La invitación expiró.' }, { status: 410, statusText: 'Gone' });
    expect(acceptError?.message).toBe('La invitación expiró.');
  });

  it('envía el nombre opcional normalizado', () => {
    service
      .create('c-1', {
        name: '  Ana  ',
        email: 'ana@test',
        storeId: 't-1',
        participationPercentage: 25,
      })
      .subscribe();
    const request = httpMock.expectOne('https://api.test/empresas/c-1/invitaciones/vendedores');
    expect(request.request.body).toEqual({
      nombre: 'Ana',
      correo: 'ana@test',
      tienda_id: 't-1',
      participacion_porcentaje: 25,
    });
    request.flush({ id: 'i-2', correo: 'ana@test', tienda_id: 't-1' });
  });

  it('devuelve un error claro cuando el API no está configurado', () => {
    environment.apiUrl = '';
    const messages: string[] = [];
    service.list('c-1').subscribe({ error: (error: Error) => messages.push(error.message) });
    service
      .revoke('c-1', 'i-1')
      .subscribe({ error: (error: Error) => messages.push(error.message) });
    service.getPublic('token').subscribe({ error: (error: Error) => messages.push(error.message) });
    service.accept('token', { name: 'Ana', password: 'secreto123' }).subscribe({
      error: (error: Error) => messages.push(error.message),
    });
    expect(messages).toHaveLength(4);
    expect(messages[0]).toContain('apiUrl no configurado');
  });
});
