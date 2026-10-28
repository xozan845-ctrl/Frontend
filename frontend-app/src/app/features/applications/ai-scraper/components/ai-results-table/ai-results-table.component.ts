import { Component, computed, input } from '@angular/core';
import { AiResultItem } from '../../models/ai-job.model';

/** Tabla de items extraídos por un job (`R-SO-6`). */
@Component({
  selector: 'app-ai-results-table',
  templateUrl: './ai-results-table.component.html',
})
export class AiResultsTableComponent {
  readonly items = input<AiResultItem[]>([]);

  readonly columns = computed(() => {
    const first = this.items()[0];
    if (!first) return [];
    return Object.keys(first).filter((key) => key !== '_source');
  });

  readonly rows = computed(() =>
    this.items().map((item) => ({
      item,
      cells: this.columns().map((column) => this.display(item, column)),
      source: item._source?.url ?? '—',
    })),
  );

  private display(item: AiResultItem, column: string): string {
    const value = item[column];
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}
