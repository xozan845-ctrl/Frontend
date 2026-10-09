import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AiHealth, AiMetrics } from '../models/ai-metrics.model';
import { AiMetricsRepository } from '../repositories/ai-metrics.repository';
import { AI_SCRAPER_ENDPOINTS } from '../constants/ai-scraper.constants';
import { adaptHealthFromBackend, adaptMetricsFromBackend } from '../adapters/ai-scraper.adapter';
import { AiScraperClient } from './ai-scraper-client.service';
import { fail } from './ai-scraper-error';

/** Implementación HTTP del puerto de métricas/salud (`R-CX-2`). */
@Injectable({
  providedIn: 'root',
})
export class AiMetricsService implements AiMetricsRepository {
  private readonly client = inject(AiScraperClient);

  getMetrics(): Observable<AiMetrics> {
    return this.client
      .get(AI_SCRAPER_ENDPOINTS.metrics)
      .pipe(map(adaptMetricsFromBackend), fail('No se pudieron cargar las métricas.'));
  }

  getHealth(): Observable<AiHealth> {
    return this.client
      .get(AI_SCRAPER_ENDPOINTS.health)
      .pipe(map(adaptHealthFromBackend), fail('No se pudo consultar la salud del backend.'));
  }
}
