import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from '../state/auth.store';

describe('authInterceptor', () => {
  const build = (store: Record<string, unknown>) => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStore, useValue: store },
      ],
    });
    return {
      http: TestBed.inject(HttpClient),
      httpMock: TestBed.inject(HttpTestingController),
    };
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe agregar el header Authorization cuando hay token', () => {
    const { http, httpMock } = build({ token: () => 'jwt-token' });

    http.get('/recurso').subscribe();
    const request = httpMock.expectOne('/recurso');

    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush({});
  });

  it('no debe agregar Authorization cuando no hay token', () => {
    const { http, httpMock } = build({ token: () => null });

    http.get('/recurso').subscribe();
    const request = httpMock.expectOne('/recurso');

    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  const tick = () => new Promise((resolve) => setTimeout(resolve));

  it('ante un 401 renueva la sesión y reintenta con el token nuevo', async () => {
    let token = 'viejo';
    const refreshTokenOnce = vi.fn().mockImplementation(() => {
      token = 'nuevo';
      return Promise.resolve(true);
    });
    const { http, httpMock } = build({ token: () => token, refreshTokenOnce });

    let result: unknown;
    http.get('/recurso').subscribe((response) => (result = response));

    const first = httpMock.expectOne('/recurso');
    expect(first.request.headers.get('Authorization')).toBe('Bearer viejo');
    first.flush({}, { status: 401, statusText: 'Unauthorized' });

    await tick();
    const retry = httpMock.expectOne('/recurso');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer nuevo');
    retry.flush({ ok: true });

    expect(refreshTokenOnce).toHaveBeenCalledOnce();
    expect(result).toEqual({ ok: true });
  });

  it('no reintenta si la renovación falla', async () => {
    const refreshTokenOnce = vi.fn().mockResolvedValue(false);
    const { http, httpMock } = build({ token: () => 'viejo', refreshTokenOnce });

    let error: unknown;
    http.get('/recurso').subscribe({ error: (err) => (error = err) });

    httpMock.expectOne('/recurso').flush({}, { status: 401, statusText: 'Unauthorized' });

    await tick();
    expect(refreshTokenOnce).toHaveBeenCalledOnce();
    expect((error as { status: number }).status).toBe(401);
    httpMock.expectNone('/recurso');
  });

  it('no reintenta en los endpoints de auth', () => {
    const refreshTokenOnce = vi.fn().mockResolvedValue(true);
    const { http, httpMock } = build({ token: () => null, refreshTokenOnce });

    http.post('/auth/login', {}).subscribe({ error: () => undefined });

    httpMock.expectOne('/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(refreshTokenOnce).not.toHaveBeenCalled();
  });
});
