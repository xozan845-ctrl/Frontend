import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AiScraperClient } from './ai-scraper-client.service';
import { environment } from '../../../../../../environments/environment';

describe('AiScraperClient', () => {
  let client: AiScraperClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    client = TestBed.inject(AiScraperClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('debe hacer GET contra la URL del backend de IA', () => {
    client.get('/jobs').subscribe();

    const request = http.expectOne(`${environment.aiScraperUrl}/jobs`);
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('debe hacer POST con las cabeceras indicadas', () => {
    client.post('/jobs', { url: 'https://example.com' }, { 'x-api-key': 'secreta' }).subscribe();

    const request = http.expectOne(`${environment.aiScraperUrl}/jobs`);
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('x-api-key')).toBe('secreta');
    expect(request.request.body).toEqual({ url: 'https://example.com' });
    request.flush({});
  });
});
