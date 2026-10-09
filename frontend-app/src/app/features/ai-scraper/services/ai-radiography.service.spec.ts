import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AiRadiographyService } from './ai-radiography.service';
import { AiScraperClient } from './ai-scraper-client.service';
import {
  BACKEND_LEARNED_PROFILE,
  BACKEND_RADIOGRAPHY,
} from '../adapters/fixtures/ai-scraper.fixture';

const BASE = 'http://localhost:3000/api/v1';

describe('AiRadiographyService', () => {
  let service: AiRadiographyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AiScraperClient,
        AiRadiographyService,
      ],
    });
    service = TestBed.inject(AiRadiographyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debe lanzar la radiografía con los parámetros opcionales', () => {
    service
      .run({ url: 'https://x.test', maxDepth: 2, maxPages: 10, forceBrowser: true })
      .subscribe();
    const req = httpMock.expectOne(`${BASE}/radiography`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      url: 'https://x.test',
      maxDepth: 2,
      maxPages: 10,
      forceBrowser: true,
    });
    req.flush(BACKEND_RADIOGRAPHY);
  });

  it('no debe enviar parámetros no definidos', () => {
    service.run({ url: 'https://x.test' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/radiography`);
    expect(req.request.body).toEqual({ url: 'https://x.test' });
    req.flush(BACKEND_RADIOGRAPHY);
  });

  it('debe cargar el perfil aprendido codificando el dominio', () => {
    service.getLearnedProfile('tienda.example').subscribe();
    httpMock
      .expectOne(`${BASE}/radiography/profile/tienda.example/selectors`)
      .flush(BACKEND_LEARNED_PROFILE);
  });
});
