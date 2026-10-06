import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/auth.model';
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
    expect(request.request.body).toEqual({ email: 'ana@tienda.com', password: 'secreto1' });
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
    const request = httpMock.expectOne('https://api.test/auth/register');
    expect(request.request.method).toBe('POST');
    request.flush({ token: 'jwt', user: { id: 2, name: 'Nuevo', email: 'nuevo@tienda.com' } });

    expect(result?.user.name).toBe('Nuevo');
  });

  it('debe cerrar sesión con un POST de logout', () => {
    environment.apiUrl = 'https://api.test';
    build();
    let result: boolean | undefined;

    service.logout().subscribe((r) => (result = r));
    const request = httpMock.expectOne('https://api.test/auth/logout');
    expect(request.request.method).toBe('POST');
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

  it('debe emitir un error cuando no hay apiUrl configurada', () => {
    environment.apiUrl = '';
    build();
    let error: Error | undefined;

    service.login({ email: 'a@b.com', password: 'secreto1' }).subscribe({
      error: (err: Error) => (error = err),
    });

    expect(error?.message).toContain('apiUrl no configurado');
  });
});
