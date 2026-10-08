import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RuntimeConfigService } from './runtime-config.service';
import { environment } from '../../../environments/environment';

describe('RuntimeConfigService', () => {
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;
  const originalStoreId = environment.apiConfig.storeId;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    environment.apiUrl = originalApiUrl;
    environment.apiConfig.storeId = originalStoreId;
  });

  it('aplica apiUrl y storeId desde config.json', async () => {
    const service = TestBed.inject(RuntimeConfigService);

    const pending = service.load();
    httpMock
      .expectOne('config.json')
      .flush({ apiUrl: 'https://api.example.com/api/v1', storeId: 'store-42' });
    await pending;

    expect(environment.apiUrl).toBe('https://api.example.com/api/v1');
    expect(environment.apiConfig.storeId).toBe('store-42');
  });

  it('conserva environment si config.json falla', async () => {
    const service = TestBed.inject(RuntimeConfigService);

    const pending = service.load();
    httpMock.expectOne('config.json').error(new ProgressEvent('error'));
    await pending;

    expect(environment.apiUrl).toBe(originalApiUrl);
    expect(environment.apiConfig.storeId).toBe(originalStoreId);
  });

  it('ignora valores vacíos y mantiene el fallback de environment', async () => {
    const service = TestBed.inject(RuntimeConfigService);

    const pending = service.load();
    httpMock.expectOne('config.json').flush({ apiUrl: '', storeId: '' });
    await pending;

    expect(environment.apiUrl).toBe(originalApiUrl);
    expect(environment.apiConfig.storeId).toBe(originalStoreId);
  });
});
