import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthResponse, User } from '../models/auth.model';
import { environment } from '../../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const originalApiUrl = environment.apiUrl;
  const originalDataSource = environment.apiConfig.dataSource;

  const build = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => TestBed.resetTestingModule());

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
    environment.apiConfig.dataSource = originalDataSource;
  });

  it('debe enviar el login por POST y adaptar la respuesta', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: AuthResponse | undefined;

    service.login({ email: 'ana@tienda.com', password: 'secreto1' }).subscribe((r) => (result = r));
    const request = httpMock.expectOne('https://api.test/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ correo: 'ana@tienda.com', contrasena: 'secreto1' });
    request.flush({ token: 'jwt', user: { id: 1, name: 'Ana', email: 'ana@tienda.com' } });

    expect(result?.token).toBe('jwt');
    expect(result?.user.name).toBe('Ana');
  });

  it('debe enviar el registro por POST', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: AuthResponse | undefined;

    service
      .register({ email: 'nuevo@tienda.com', password: 'secreto1', name: 'Nuevo' })
      .subscribe((r) => (result = r));
    const request = httpMock.expectOne('https://api.test/auth/registro');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombre: 'Nuevo',
      correo: 'nuevo@tienda.com',
      contrasena: 'secreto1',
      rol: 'comprador',
    });
    request.flush({ token: 'jwt', user: { id: 2, name: 'Nuevo', email: 'nuevo@tienda.com' } });

    expect(result?.user.name).toBe('Nuevo');
  });

  it('debe registrar como vendedor cuando el rol es seller', () => {
    environment.apiUrl = 'https://api.test';
    build();

    service
      .register({
        email: 'v@tienda.test',
        password: 'secreto123',
        name: 'Vendedor',
        role: 'seller',
      })
      .subscribe();
    const request = httpMock.expectOne('https://api.test/auth/registro');
    expect(request.request.body).toEqual({
      nombre: 'Vendedor',
      correo: 'v@tienda.test',
      contrasena: 'secreto123',
      rol: 'vendedor',
    });
    request.flush({ token: 'jwt', user: { id: 3, name: 'Vendedor', email: 'v@tienda.test' } });
  });

  it('debe cerrar sesión enviando el refresh_token (revoca solo esa sesión)', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: boolean | undefined;

    service.logout('refresh-1').subscribe((r) => (result = r));
    const request = httpMock.expectOne('https://api.test/auth/logout');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ refresh_token: 'refresh-1' });
    request.flush({});

    expect(result).toBe(true);
  });

  it('debe renovar la sesión con el refresh token', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: AuthResponse | undefined;

    service.refresh('refresh-1').subscribe((r) => (result = r));
    const request = httpMock.expectOne('https://api.test/auth/refresh');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ refresh_token: 'refresh-1' });
    request.flush({ token: 'nuevo', user: { id: 1, name: 'Ana', email: 'ana@tienda.com' } });

    expect(result?.token).toBe('nuevo');
  });

  it('debe obtener el perfil de la sesión con GET /auth/me', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: User | undefined;

    service.me().subscribe((u) => (result = u));
    const request = httpMock.expectOne('https://api.test/auth/me');
    expect(request.request.method).toBe('GET');
    request.flush({ user_id: 'u-1', email: 'ana@tienda.com', rol: 'comprador' });

    expect(result?.id).toBe('u-1');
    expect(result?.email).toBe('ana@tienda.com');
    expect(result?.role).toBe('comprador');
  });

  it('debe solicitar el restablecimiento de contraseña', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: boolean | undefined;

    service.resetPassword('ana@tienda.com').subscribe((r) => (result = r));
    const request = httpMock.expectOne('https://api.test/auth/restablecer-contrasena');
    expect(request.request.body).toEqual({ correo: 'ana@tienda.com' });
    request.flush({ ok: true });

    expect(result).toBe(true);
  });

  it('debe cambiar la contraseña', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: boolean | undefined;

    service.changePassword('actual123', 'nueva12345').subscribe((r) => (result = r));
    const request = httpMock.expectOne('https://api.test/auth/cambiar-contrasena');
    expect(request.request.body).toEqual({ actual: 'actual123', nueva: 'nueva12345' });
    request.flush({ ok: true });

    expect(result).toBe(true);
  });

  it('debe traducir el error de cambiar la contraseña', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.changePassword('mala', 'nueva12345').subscribe({ error: (e: Error) => (error = e) });
    httpMock
      .expectOne('https://api.test/auth/cambiar-contrasena')
      .flush(
        { mensaje: 'La contraseña actual es incorrecta.' },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(error?.message).toBe('La contraseña actual es incorrecta.');
  });

  it('debe traducir el error de GET /auth/me con el fallback', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let error: Error | undefined;

    service.me().subscribe({ error: (e: Error) => (error = e) });
    httpMock
      .expectOne('https://api.test/auth/me')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(error?.message).toBe('No se pudo cargar tu perfil.');
  });

  it('debe emitir un error cuando no hay apiUrl configurada', () => {
    environment.apiUrl = '';
    build();
    let error: Error | undefined;

    service.login({ email: 'a@b.com', password: 'secreto1' }).subscribe({
      error: (err: Error) => (error = err),
    });

    expect(error?.message).toContain('apiUrl no configurado');
  });

  describe('dataSource mock', () => {
    beforeEach(() => {
      environment.apiConfig.dataSource = 'mock';
    });

    it('debe autenticar en mock cuando las credenciales son válidas', async () => {
      build();
      let result: AuthResponse | undefined;

      service
        .login({ email: 'ana@tienda.com', password: 'secreto1' })
        .subscribe((r) => (result = r));
      await vi.waitFor(() => expect(result).toBeDefined(), { timeout: 2000 });

      expect(result?.user.email).toBe('ana@tienda.com');
      expect(result?.token).toContain('mock-jwt');
    });

    it('debe rechazar en mock cuando la contraseña es corta', () => {
      build();
      let error: Error | undefined;

      service.login({ email: 'ana@tienda.com', password: '123' }).subscribe({
        error: (err: Error) => (error = err),
      });

      expect(error?.message).toContain('Credenciales inválidas');
    });

    it('debe registrar en mock', async () => {
      build();
      let result: AuthResponse | undefined;

      service
        .register({ name: 'Nuevo', email: 'nuevo@tienda.com', password: 'secreto1' })
        .subscribe((r) => (result = r));
      await vi.waitFor(() => expect(result).toBeDefined(), { timeout: 2000 });

      expect(result?.user.name).toBe('Nuevo');
    });

    it('debe cerrar sesión en mock', async () => {
      build();
      let result: boolean | undefined;

      service.logout().subscribe((r) => (result = r));
      await vi.waitFor(() => expect(result).toBe(true), { timeout: 2000 });

      expect(result).toBe(true);
    });

    it('debe renovar la sesión en mock', async () => {
      build();
      let result: AuthResponse | undefined;

      service.refresh('refresh-1').subscribe((r) => (result = r));
      await vi.waitFor(() => expect(result).toBeDefined(), { timeout: 2000 });

      expect(result?.refreshToken).toBe('refresh-1');
    });
  });

  describe('sin apiUrl configurada', () => {
    beforeEach(() => {
      environment.apiUrl = '';
    });

    it('debe fallar el registro', () => {
      build();
      let error: Error | undefined;

      service
        .register({ name: 'Nuevo', email: 'nuevo@tienda.com', password: 'secreto1' })
        .subscribe({ error: (err: Error) => (error = err) });

      expect(error?.message).toContain('apiUrl no configurado');
    });

    it('debe fallar el logout', () => {
      build();
      let error: Error | undefined;

      service.logout().subscribe({ error: (err: Error) => (error = err) });

      expect(error?.message).toContain('apiUrl no configurado');
    });

    it('debe fallar la renovación', () => {
      build();
      let error: Error | undefined;

      service.refresh('refresh-1').subscribe({ error: (err: Error) => (error = err) });

      expect(error?.message).toContain('apiUrl no configurado');
    });
  });
});
