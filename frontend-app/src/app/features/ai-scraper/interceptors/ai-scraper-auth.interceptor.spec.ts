import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aiScraperAuthInterceptor } from './ai-scraper-auth.interceptor';
import { AiConnectionService } from '../services/ai-connection.service';

describe('aiScraperAuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let connection: AiConnectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([aiScraperAuthInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    connection = TestBed.inject(AiConnectionService);
    connection.clearApiKey();
  });

  afterEach(() => {
    connection.clearApiKey();
    httpMock.verify();
  });

  it('debe añadir x-api-key a las peticiones al backend de IA cuando hay clave', () => {
    connection.setApiKey('secret');
    http.get('http://localhost:3000/api/v1/jobs').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/v1/jobs');
    expect(req.request.headers.get('x-api-key')).toBe('secret');
    req.flush({});
  });

  it('no debe añadir la cabecera a otros hosts', () => {
    connection.setApiKey('secret');
    http.get('http://localhost:8080/api/v1/products').subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/v1/products');
    expect(req.request.headers.has('x-api-key')).toBe(false);
    req.flush({});
  });

  it('no debe añadir la cabecera cuando no hay clave', () => {
    http.get('http://localhost:3000/api/v1/jobs').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/v1/jobs');
    expect(req.request.headers.has('x-api-key')).toBe(false);
    req.flush({});
  });
});
