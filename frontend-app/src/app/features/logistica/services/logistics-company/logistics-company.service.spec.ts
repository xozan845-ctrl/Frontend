import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';
import { LogisticsCompanyService } from './logistics-company.service';

describe('LogisticsCompanyService', () => {
  let service: LogisticsCompanyService;
  let http: HttpTestingController;
  const originalUrl = environment.apiUrl;
  const originalSource = environment.apiConfig.dataSource;

  beforeEach(() => {
    environment.apiUrl = 'https://api.test';
    environment.apiConfig.dataSource = 'api';
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LogisticsCompanyService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    environment.apiUrl = originalUrl;
    environment.apiConfig.dataSource = originalSource;
    http.verify();
    TestBed.resetTestingModule();
  });

  it('crea un tenant logístico independiente', () => {
    let result: { id: string; name: string } | undefined;
    service
      .create({ name: 'Rutas del Pacífico', slug: 'rutas-del-pacifico' })
      .subscribe((company) => {
        result = company;
      });

    const request = http.expectOne('https://api.test/logistics/companies');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombre: 'Rutas del Pacífico',
      slug: 'rutas-del-pacifico',
    });
    request.flush({ id: 'log-1', nombre: 'Rutas del Pacífico', slug: 'rutas-del-pacifico' });

    expect(result).toMatchObject({ id: 'log-1', name: 'Rutas del Pacífico' });
  });

  it('soporta el adaptador mock', async () => {
    environment.apiConfig.dataSource = 'mock';
    const result = await new Promise((resolve) =>
      service.create({ name: 'Mock' }).subscribe(resolve),
    );
    expect(result).toMatchObject({ name: 'Mock', status: 'activa' });
  });

  it('expone un error claro si falta apiUrl', async () => {
    environment.apiUrl = '';
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LogisticsCompanyService);
    http = TestBed.inject(HttpTestingController);
    await expect(
      new Promise((resolve, reject) =>
        service.create({ name: 'Sin API' }).subscribe(resolve, reject),
      ),
    ).rejects.toThrow('apiUrl no configurado');
  });

  it('rechaza respuestas sin id', () => {
    let error: Error | undefined;
    service.create({ name: 'Inválida' }).subscribe({ error: (value) => (error = value) });
    http.expectOne('https://api.test/logistics/companies').flush({ nombre: 'Inválida' });
    expect(error?.message).toContain('No se pudo interpretar');
  });
});
