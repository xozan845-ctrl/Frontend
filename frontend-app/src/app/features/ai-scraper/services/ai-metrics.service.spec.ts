import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AiMetricsService } from './ai-metrics.service';
import { AiScraperClient } from './ai-scraper-client.service';
import { BACKEND_HEALTH, BACKEND_METRICS } from '../adapters/fixtures/ai-scraper.fixture';

const BASE = 'http://localhost:3000/api/v1';

describe('AiMetricsService', () => {
  let service: AiMetricsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AiScraperClient,
        AiMetricsService,
      ],
    });
    service = TestBed.inject(AiMetricsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debe cargar las métricas agregadas', () => {
    let metrics: unknown;
    service.getMetrics().subscribe((m) => (metrics = m));
    httpMock.expectOne(`${BASE}/metrics`).flush(BACKEND_METRICS);
    expect((metrics as { pendingJobs: number }).pendingJobs).toBe(2);
  });

  it('debe cargar la salud del backend', () => {
    service.getHealth().subscribe();
    httpMock.expectOne(`${BASE}/health`).flush(BACKEND_HEALTH);
  });

  it('debe traducir la caída de red a un mensaje de dominio', () => {
    let error: Error | undefined;
    service.getMetrics().subscribe({ error: (err: Error) => (error = err) });
    httpMock.expectOne(`${BASE}/metrics`).error(new ProgressEvent('error'));
    expect(error?.message).toContain('No pudimos conectar');
  });
});
