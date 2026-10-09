import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AiMetricsCardsComponent } from './ai-metrics-cards.component';
import { AiMetrics } from '../../models/ai-metrics.model';

const METRICS: AiMetrics = {
  instance: 'api-1',
  uptimeSec: 10,
  store: 'prisma',
  queue: 'bullmq',
  pendingJobs: 1,
  stats: {
    jobsTotal: 5,
    jobsByStatus: { COMPLETED: 3, FAILED: 1, QUEUED: 1 },
    resultsTotal: 20,
    pagesTotal: 8,
    commandsTotal: 12,
    commandsRecovered: 2,
    aiCallsTotal: 4,
    aiTokensTotal: 1000,
  },
  aiRecoveryRate: 0.25,
  distributed: {},
};

describe('AiMetricsCardsComponent', () => {
  it('debe renderizar las tarjetas de métricas', () => {
    const fixture = TestBed.createComponent(AiMetricsCardsComponent);
    fixture.componentRef.setInput('metrics', METRICS);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Jobs');
    expect(text).toContain('25.0%');
  });

  it('debe mostrar el estado vacío sin métricas', () => {
    const fixture = TestBed.createComponent(AiMetricsCardsComponent);
    fixture.componentRef.setInput('metrics', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="ai-metrics-empty"]')).not.toBeNull();
  });
});
