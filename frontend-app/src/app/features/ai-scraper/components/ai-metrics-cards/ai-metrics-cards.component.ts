import { Component, input } from '@angular/core';
import { AiMetrics } from '../../models/ai-metrics.model';

interface MetricCard {
  label: string;
  value: string;
}

/** Tarjetas de métricas del backend de IA (`R-SO-6`). */
@Component({
  selector: 'app-ai-metrics-cards',
  templateUrl: './ai-metrics-cards.component.html',
})
export class AiMetricsCardsComponent {
  readonly metrics = input<AiMetrics | null>(null);

  get cards(): MetricCard[] {
    const m = this.metrics();
    if (!m) return [];
    const by = m.stats.jobsByStatus;
    const running = (by['PLANNING'] ?? 0) + (by['EXECUTING'] ?? 0) + (by['EXPLORING'] ?? 0);
    return [
      { label: 'Jobs', value: String(m.stats.jobsTotal) },
      { label: 'En cola', value: String(by['QUEUED'] ?? 0) },
      { label: 'En curso', value: String(running) },
      { label: 'Completados', value: String(by['COMPLETED'] ?? 0) },
      { label: 'Fallidos', value: String(by['FAILED'] ?? 0) },
      { label: 'Items', value: String(m.stats.resultsTotal) },
      { label: 'Páginas', value: String(m.stats.pagesTotal) },
      { label: 'Recuperación IA', value: `${(m.aiRecoveryRate * 100).toFixed(1)}%` },
    ];
  }
}
