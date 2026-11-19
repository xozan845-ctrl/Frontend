import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
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

  it('debe cargar config.json sin ejecutar interceptores cuando la sesión aún no está construida', async () => {
    // regression: F10 (R-REG-1)
    let interceptorCalls = 0;
    const sessionInterceptor: HttpInterceptorFn = (req, next) => {
      interceptorCalls += 1;
      return next(req);
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([sessionInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(RuntimeConfigService);

    const pending = service.load();
    httpMock.expectOne('config.json').flush({ apiUrl: 'https://api-b.example.com/api/v1' });
    await pending;

    expect(interceptorCalls).toBe(0);
    expect(environment.apiUrl).toBe('https://api-b.example.com/api/v1');
  });

  it('debe descartar la apiUrl compilada cuando config.json falla', async () => {
    const service = TestBed.inject(RuntimeConfigService);

    const pending = service.load();
    httpMock.expectOne('config.json').error(new ProgressEvent('error'));
    await pending;

    expect(environment.apiUrl).toBe('');
  });

  it('debe descartar la apiUrl compilada cuando config.json no trae apiUrl', async () => {
    const service = TestBed.inject(RuntimeConfigService);

    const pending = service.load();
    httpMock.expectOne('config.json').flush({ apiUrl: '' });
    await pending;

    expect(environment.apiUrl).toBe('');
  });

  it('debe descartar la apiUrl compilada cuando config.json trae una apiUrl inválida', async () => {
    const service = TestBed.inject(RuntimeConfigService);

    const pending = service.load();
    httpMock.expectOne('config.json').flush({ apiUrl: 'no-es-una-url' });
    await pending;

    expect(environment.apiUrl).toBe('');
  });

  it('debe descartar una apiUrl relativa al protocolo cuando config.json la trae', async () => {
    const service = TestBed.inject(RuntimeConfigService);

    const pending = service.load();
    httpMock.expectOne('config.json').flush({ apiUrl: '//api-ajena.example.com/api/v1' });
    await pending;

    expect(environment.apiUrl).toBe('');
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
