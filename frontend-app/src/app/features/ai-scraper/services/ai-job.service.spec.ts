import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AiJobService } from './ai-job.service';
import { AiScraperClient } from './ai-scraper-client.service';
import {
  BACKEND_JOB_CAMEL,
  BACKEND_JOB_EXECUTION,
  BACKEND_JOB_LIST,
  BACKEND_JOB_RESULTS,
  BACKEND_INTERACTIONS,
} from '../adapters/fixtures/ai-scraper.fixture';

const BASE = 'http://localhost:3000/api/v1';

describe('AiJobService', () => {
  let service: AiJobService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AiScraperClient, AiJobService],
    });
    service = TestBed.inject(AiJobService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debe crear un job enviando payload y clave de idempotencia', () => {
    let received: unknown;
    service
      .createJob({ url: 'https://x.test', instruction: 'extrae' }, 'key-1')
      .subscribe((job) => (received = job));

    const req = httpMock.expectOne(`${BASE}/jobs`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Idempotency-Key')).toBe('key-1');
    expect(req.request.body).toEqual({ url: 'https://x.test', instruction: 'extrae' });
    req.flush(BACKEND_JOB_CAMEL);

    expect((received as { id: string }).id).toBe('job-1');
  });

  it('debe listar jobs con paginación y filtro por estado', () => {
    service.listJobs({ limit: 10, cursor: 'c1', status: 'FAILED' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/jobs?limit=10&cursor=c1&status=FAILED`);
    expect(req.request.method).toBe('GET');
    req.flush(BACKEND_JOB_LIST);
  });

  it('debe cargar el detalle de un job', () => {
    service.getJob('job-1').subscribe();
    httpMock.expectOne(`${BASE}/jobs/job-1`).flush(BACKEND_JOB_CAMEL);
  });

  it('debe cargar los resultados con trazabilidad', () => {
    service.getResults('job-1').subscribe();
    httpMock.expectOne(`${BASE}/jobs/job-1/results`).flush(BACKEND_JOB_RESULTS);
  });

  it('debe cargar la ejecución del job', () => {
    service.getExecution('job-1').subscribe();
    httpMock.expectOne(`${BASE}/jobs/job-1/execution`).flush(BACKEND_JOB_EXECUTION);
  });

  it('debe cargar las interacciones de IA con límite', () => {
    service.getInteractions('job-1', 5).subscribe();
    httpMock.expectOne(`${BASE}/jobs/job-1/ai?limit=5`).flush(BACKEND_INTERACTIONS);
  });

  it('debe cancelar un job por POST', () => {
    service.cancelJob('job-1').subscribe();
    const req = httpMock.expectOne(`${BASE}/jobs/job-1/cancel`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...BACKEND_JOB_CAMEL, status: 'CANCELLED' });
  });

  it('debe reintentar un job por POST', () => {
    service.retryJob('job-1').subscribe();
    const req = httpMock.expectOne(`${BASE}/jobs/job-1/retry`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...BACKEND_JOB_CAMEL, status: 'QUEUED' });
  });

  it('debe traducir un error HTTP a un mensaje de dominio', () => {
    let error: Error | undefined;
    service.getJob('job-1').subscribe({ error: (err: Error) => (error = err) });
    httpMock
      .expectOne(`${BASE}/jobs/job-1`)
      .flush({ message: 'Job no encontrado' }, { status: 404, statusText: 'Not Found' });
    expect(error?.message).toBe('Job no encontrado');
  });
});
