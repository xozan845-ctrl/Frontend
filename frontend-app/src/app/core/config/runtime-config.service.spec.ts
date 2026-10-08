import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RuntimeConfigService } from './runtime-config.service';
import { environment } from '../../../environments/environment';

describe('RuntimeConfigService', () => {
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    environment.apiUrl = originalApiUrl;
  });

  it('aplica apiUrl desde config.json', async () => {
    const service = TestBed.inject(RuntimeConfigService);

    const pending = service.load();
    httpMock.expectOne('config.json').flush({ apiUrl: 'https://api.example.com/api/v1' });
    await pending;

    expect(environment.apiUrl).toBe('https://api.example.com/api/v1');
  });

  it('conserva environment si config.json falla', async () => {
    const service = TestBed.inject(RuntimeConfigService);

    const pending = service.load();
    httpMock.expectOne('config.json').error(new ProgressEvent('error'));
    await pending;

    expect(environment.apiUrl).toBe(originalApiUrl);
  });

  it('ignora apiUrl vacío y mantiene el fallback de environment', async () => {
    const service = TestBed.inject(RuntimeConfigService);

    const pending = service.load();
    httpMock.expectOne('config.json').flush({ apiUrl: '' });
    await pending;

    expect(environment.apiUrl).toBe(originalApiUrl);
  });
});
