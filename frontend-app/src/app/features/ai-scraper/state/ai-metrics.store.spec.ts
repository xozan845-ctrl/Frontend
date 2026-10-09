import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { AiMetricsStore } from './ai-metrics.store';
import { AI_METRICS_REPOSITORY } from '../repositories/ai-metrics.repository';

function makeRepo() {
  return { getMetrics: vi.fn(), getHealth: vi.fn() };
}

describe('AiMetricsStore', () => {
  let store: InstanceType<typeof AiMetricsStore>;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
    TestBed.configureTestingModule({
      providers: [AiMetricsStore, { provide: AI_METRICS_REPOSITORY, useValue: repo }],
    });
    store = TestBed.inject(AiMetricsStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('debe cargar métricas y salud', () => {
    repo.getMetrics.mockReturnValue(
      of({ instance: 'api-1', pendingJobs: 2, stats: {}, distributed: {} }),
    );
    repo.getHealth.mockReturnValue(of({ status: 'ok', service: 'api', time: '', checks: {} }));
    store.load();
    expect(store.metrics()?.pendingJobs).toBe(2);
    expect(store.health()?.status).toBe('ok');
    expect(store.loading()).toBe(false);
  });

  it('debe seguir cargando si la salud falla (best-effort)', () => {
    repo.getMetrics.mockReturnValue(
      of({ instance: 'api-1', pendingJobs: 0, stats: {}, distributed: {} }),
    );
    repo.getHealth.mockReturnValue(throwError(() => new Error('health caído')));
    store.load();
    expect(store.metrics()).not.toBeNull();
    expect(store.health()).toBeNull();
  });

  it('debe exponer el error cuando las métricas fallan', () => {
    repo.getMetrics.mockReturnValue(throwError(() => new Error('sin métricas')));
    repo.getHealth.mockReturnValue(of({ status: 'ok', service: 'api', time: '', checks: {} }));
    store.load();
    expect(store.error()).toBe('sin métricas');
  });
});
