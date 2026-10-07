import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from '../state/auth.store';

describe('authInterceptor', () => {
  const build = (token: string | null) => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStore, useValue: { token: () => token } },
      ],
    });
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('debe agregar el header Authorization cuando hay token', () => {
    build('jwt-token');
    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);

    http.get('/recurso').subscribe();
    const request = httpMock.expectOne('/recurso');

    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush({});
  });

  it('no debe agregar Authorization cuando no hay token', () => {
    build(null);
    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);

    http.get('/recurso').subscribe();
    const request = httpMock.expectOne('/recurso');

    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
