import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { AiHealth, AiMetrics } from '../models/ai-metrics.model';

/**
 * Puerto de observabilidad del backend de IA (`R-AR-3`, `R-SO-4`): métricas
 * agregadas y salud (liveness/readiness).
 */
export interface AiMetricsRepository {
  /** Métricas agregadas (jobs, resultados, recuperación IA, distribuidos). */
  getMetrics(): Observable<AiMetrics>;
  /** Liveness/readiness del backend. */
  getHealth(): Observable<AiHealth>;
}

export const AI_METRICS_REPOSITORY = new InjectionToken<AiMetricsRepository>('AiMetricsRepository');
