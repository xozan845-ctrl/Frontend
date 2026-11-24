import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RuntimeConfigService } from './runtime-config.service';
import { environment } from '../../../environments/environment';

describe('RuntimeConfigService', () => {
  let httpMock: HttpTestingController;
  const originalApiUrl = environment.apiUrl;
  const originalDataSource = environment.apiConfig.dataSource;
  const originalProduction = environment.production;

  beforeEach(() => {
    environment.production = true;
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    environment.apiUrl = originalApiUrl;
    environment.apiConfig.dataSource = originalDataSource;
    environment.production = originalProduction;
  });

  it('aplica apiUrl desde config.json', async () => {
    const service = TestBed.inject(RuntimeConfigService);

    const pending = service.load();
    httpMock.expectOne('config.json').flush({ apiUrl: 'https://api.example.com/api/v1' });
    await pending;

    expect(environment.apiUrl).toBe('https://api.example.com/api/v1');
  });

  it('expone la configuración pública por tienda sin mezclarla con el entorno', async () => {
    const service = TestBed.inject(RuntimeConfigService);

    const pending = service.load();
    httpMock.expectOne('config.json').flush({
      storefront: { name: 'Operador' },
      storefronts: { 'tienda-b': { name: 'Tienda B', benefits: [] } },
    });
    await pending;

    expect(service.storefrontFor('tienda-b')?.name).toBe('Tienda B');
    expect(service.storefrontFor('tienda-a')?.name).toBe('Operador');
    expect(environment.apiUrl).toBe(originalApiUrl);
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

  it('no carga ni aplica config.json en modo mock (E2E)', async () => {
    environment.apiConfig.dataSource = 'mock';
    const service = TestBed.inject(RuntimeConfigService);

    await service.load();

    httpMock.expectNone('config.json');
    expect(environment.apiUrl).toBe(originalApiUrl);
  });

  it('no carga config.json en desarrollo (ng serve)', async () => {
    environment.production = false;
    const service = TestBed.inject(RuntimeConfigService);

    await service.load();

    httpMock.expectNone('config.json');
    expect(environment.apiUrl).toBe(originalApiUrl);
  });
});
