import { Component, OnDestroy, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AiJobsStore } from '../../state/ai-jobs/ai-jobs.store';
import { injectSeoPage } from '../../../../core/services/seo/seo.service';
import { AiStatusBadgeComponent } from '../../components/ai-status-badge/ai-status-badge.component';
import { AiResultsTableComponent } from '../../components/ai-results-table/ai-results-table.component';
import type { DetailTab } from './ai-job-detail.types';

/** Detalle de un job: resultados, ejecución y llamadas de IA (`R-SO-8`). */
@Component({
  selector: 'app-ai-job-detail',
  imports: [DatePipe, RouterLink, AiStatusBadgeComponent, AiResultsTableComponent],
  templateUrl: './ai-job-detail.component.html',
})
export default class AiJobDetailComponent implements OnDestroy {
  readonly id = input.required<string>();
  readonly jobsStore = inject(AiJobsStore);
  readonly tab = signal<DetailTab>('results');
  private readonly seo = injectSeoPage('Detalle del job de IA');

  /** Selecciona el job cuando cambia el id de la ruta (`R-AR-15`). */
  private readonly selectFromRoute = effect(() => {
    const id = this.id();
    if (id) untracked(() => this.jobsStore.selectJob(id));
  });

  ngOnDestroy(): void {
    this.jobsStore.clearSelected();
  }

  setTab(tab: DetailTab): void {
    this.tab.set(tab);
  }
}
