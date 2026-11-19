import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  AUTH_ALLOWED_DESTINATIONS,
  authInterceptor,
  isAllowedAuthDestination,
} from './auth.interceptor';
import { AuthStore } from '@domains/session/public-api';

const API = 'https://api.test/api/v1';

describe('authInterceptor', () => {
  const build = (store: Record<string, unknown>, destinations: readonly string[] = [API]) => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStore, useValue: store },
        { provide: AUTH_ALLOWED_DESTINATIONS, useValue: destinations },
      ],
    });
    return {
      http: TestBed.inject(HttpClient),
      httpMock: TestBed.inject(HttpTestingController),
    };
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe agregar el header Authorization cuando el destino está permitido', () => {
    const { http, httpMock } = build({ token: () => 'jwt-token' });

    http.get(`${API}/recurso`).subscribe();
    const request = httpMock.expectOne(`${API}/recurso`);

    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush({});
  });

  it('no debe agregar Authorization cuando no hay token', () => {
    const { http, httpMock } = build({ token: () => null });

    http.get(`${API}/recurso`).subscribe();
    const request = httpMock.expectOne(`${API}/recurso`);

    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('no debe agregar Authorization a un host ajeno', () => {
    const { http, httpMock } = build({ token: () => 'jwt-token' });

    http.get('https://api.test.evil.test/api/v1/recurso').subscribe();
    const request = httpMock.expectOne('https://api.test.evil.test/api/v1/recurso');

    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('no debe agregar Authorization a una ruta con prefijo parecido', () => {
    const { http, httpMock } = build({ token: () => 'jwt-token' });

    http.get('https://api.test/api/v10/recurso').subscribe();
    const request = httpMock.expectOne('https://api.test/api/v10/recurso');

    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('debe autenticar URLs relativas cuando el destino configurado es relativo', () => {
    const { http, httpMock } = build({ token: () => 'jwt-token' }, ['/api/v1']);

    http.get('/api/v1/recurso').subscribe();
    const request = httpMock.expectOne('/api/v1/recurso');

    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush({});
  });

  it('no debe autenticar una URL protocol-relative con la misma ruta', () => {
    const { http, httpMock } = build({ token: () => 'jwt-token' }, ['/api/v1']);

    http.get('//evil.test/api/v1/recurso').subscribe();
    const request = httpMock.expectOne('//evil.test/api/v1/recurso');

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
    http.get(`${API}/recurso`).subscribe((response) => (result = response));

    const first = httpMock.expectOne(`${API}/recurso`);
    expect(first.request.headers.get('Authorization')).toBe('Bearer viejo');
    first.flush({}, { status: 401, statusText: 'Unauthorized' });

    await tick();
    const retry = httpMock.expectOne(`${API}/recurso`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer nuevo');
    retry.flush({ ok: true });

    expect(refreshTokenOnce).toHaveBeenCalledOnce();
    expect(result).toEqual({ ok: true });
  });

  it('no debe renovar ni reintentar ante un 401 de un host ajeno', () => {
    const refreshTokenOnce = vi.fn().mockResolvedValue(true);
    const { http, httpMock } = build({ token: () => 'viejo', refreshTokenOnce });

    let error: unknown;
    http.get('https://evil.test/api/v1/recurso').subscribe({ error: (err) => (error = err) });

    httpMock
      .expectOne('https://evil.test/api/v1/recurso')
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(refreshTokenOnce).not.toHaveBeenCalled();
    expect((error as { status: number }).status).toBe(401);
    httpMock.expectNone('https://evil.test/api/v1/recurso');
  });

  it('no reintenta si la renovación falla', async () => {
    const refreshTokenOnce = vi.fn().mockResolvedValue(false);
    const { http, httpMock } = build({ token: () => 'viejo', refreshTokenOnce });

    let error: unknown;
    http.get(`${API}/recurso`).subscribe({ error: (err) => (error = err) });

    httpMock.expectOne(`${API}/recurso`).flush({}, { status: 401, statusText: 'Unauthorized' });

    await tick();
    expect(refreshTokenOnce).toHaveBeenCalledOnce();
    expect((error as { status: number }).status).toBe(401);
    httpMock.expectNone(`${API}/recurso`);
  });

  it('no reintenta en los endpoints de auth', () => {
    const refreshTokenOnce = vi.fn().mockResolvedValue(true);
    const { http, httpMock } = build({ token: () => null, refreshTokenOnce });

    http.post(`${API}/auth/login`, {}).subscribe({ error: () => undefined });

    httpMock.expectOne(`${API}/auth/login`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(refreshTokenOnce).not.toHaveBeenCalled();
  });

  it('no reintenta el refresh aunque la URL lleve query string', () => {
    const refreshTokenOnce = vi.fn().mockResolvedValue(true);
    const { http, httpMock } = build({ token: () => null, refreshTokenOnce });

    http.post(`${API}/auth/refresh?source=bootstrap`, {}).subscribe({ error: () => undefined });

    httpMock
      .expectOne(`${API}/auth/refresh?source=bootstrap`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(refreshTokenOnce).not.toHaveBeenCalled();
  });

  it('deduplica el refresh cuando dos requests reciben 401 en paralelo', async () => {
    let token = 'viejo';
    let resolveRefresh!: (renewed: boolean) => void;
    const refreshPromise = new Promise<boolean>((resolve) => {
      resolveRefresh = resolve;
    });
    const refreshTokenOnce = vi.fn().mockReturnValue(refreshPromise);
    const { http, httpMock } = build({ token: () => token, refreshTokenOnce });
    const results: unknown[] = [];

    http.get(`${API}/recurso`).subscribe((value) => results.push(value));
    http.get(`${API}/recurso`).subscribe((value) => results.push(value));

    const initial = httpMock.match(`${API}/recurso`);
    expect(initial).toHaveLength(2);
    initial.forEach((request) => {
      expect(request.request.headers.get('Authorization')).toBe('Bearer viejo');
      request.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    await tick();
    expect(refreshTokenOnce).toHaveBeenCalledOnce();

    token = 'nuevo';
    resolveRefresh(true);
    await tick();

    const retries = httpMock.match(`${API}/recurso`);
    expect(retries).toHaveLength(2);
    retries.forEach((request) => {
      expect(request.request.headers.get('Authorization')).toBe('Bearer nuevo');
      request.flush({ ok: true });
    });

    expect(results).toEqual([{ ok: true }, { ok: true }]);
  });

  it('debe autenticar solo el API A cuando esa configuración está habilitada', () => {
    const { http, httpMock } = build({ token: () => 'jwt-token' }, ['https://api-a.test/api/v1']);

    http.get('https://api-a.test/api/v1/recurso').subscribe();
    http.get('https://api-b.test/api/v1/recurso').subscribe();

    const allowed = httpMock.expectOne('https://api-a.test/api/v1/recurso');
    const foreign = httpMock.expectOne('https://api-b.test/api/v1/recurso');
    expect(allowed.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(foreign.request.headers.has('Authorization')).toBe(false);
    allowed.flush({});
    foreign.flush({});
  });

  it('debe autenticar solo el API B cuando esa configuración está habilitada', () => {
    const { http, httpMock } = build({ token: () => 'jwt-token' }, ['https://api-b.test/api/v1']);

    http.get('https://api-a.test/api/v1/recurso').subscribe();
    http.get('https://api-b.test/api/v1/recurso').subscribe();

    const foreign = httpMock.expectOne('https://api-a.test/api/v1/recurso');
    const allowed = httpMock.expectOne('https://api-b.test/api/v1/recurso');
    expect(foreign.request.headers.has('Authorization')).toBe(false);
    expect(allowed.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    foreign.flush({});
    allowed.flush({});
  });
});

describe('isAllowedAuthDestination', () => {
  it('debe aceptar el mismo origen y una ruta hija', () => {
    expect(isAllowedAuthDestination(`${API}/recurso?x=1`, [`${API}/`])).toBe(true);
  });

  it('no debe aceptar un host que solo comparte el prefijo', () => {
    expect(isAllowedAuthDestination('https://api.test.evil.test/api/v1/recurso', [API])).toBe(
      false,
    );
  });

  it('no debe aceptar una ruta con el mismo prefijo textual', () => {
    expect(isAllowedAuthDestination('https://api.test/api/v10/recurso', [API])).toBe(false);
  });

  it('debe aceptar una URL relativa bajo el prefijo configurado', () => {
    expect(isAllowedAuthDestination('/api/v1/recurso', ['/api/v1'])).toBe(true);
  });

  it('no debe aceptar una URL relativa fuera del prefijo configurado', () => {
    expect(isAllowedAuthDestination('/api/v10/recurso', ['/api/v1'])).toBe(false);
  });

  it('no debe aceptar una URL protocol-relative como si fuera relativa', () => {
    expect(isAllowedAuthDestination('//evil.test/api/v1/recurso', ['/api/v1'])).toBe(false);
  });
});
