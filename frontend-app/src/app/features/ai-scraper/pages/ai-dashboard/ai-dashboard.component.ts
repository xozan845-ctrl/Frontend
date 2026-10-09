import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiJobsStore } from '../../state/ai-jobs.store';
import { AiMetricsStore } from '../../state/ai-metrics.store';
import { AiConnectionService } from '../../services/ai-connection.service';
import { SeoService } from '../../../../core/services/seo.service';
import { AiStatusBadgeComponent } from '../../components/ai-status-badge/ai-status-badge.component';
import { AiMetricsCardsComponent } from '../../components/ai-metrics-cards/ai-metrics-cards.component';
import { AiConnectionPanelComponent } from '../../components/ai-connection-panel/ai-connection-panel.component';

/** Panel principal del scraping con IA (`R-AR-1`, contenedor `R-SO-8`). */
@Component({
  selector: 'app-ai-dashboard',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    AiStatusBadgeComponent,
    AiMetricsCardsComponent,
    AiConnectionPanelComponent,
  ],
  templateUrl: './ai-dashboard.component.html',
})
export default class AiDashboardComponent implements OnInit, OnDestroy {
  readonly jobsStore = inject(AiJobsStore);
  readonly metricsStore = inject(AiMetricsStore);
  private readonly connection = inject(AiConnectionService);
  private readonly fb = inject(FormBuilder);
  private readonly seo = inject(SeoService);

  readonly endpoint = this.connection.endpoint;
  readonly hasKey = this.connection.hasKey;
  readonly statusOptions = ['ALL', 'QUEUED', 'EXECUTING', 'COMPLETED', 'FAILED'];

  readonly form = this.fb.nonNullable.group({
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    instruction: ['', [Validators.required, Validators.minLength(3)]],
  });

  constructor() {
    this.seo.setPage('Scraping con IA', 'Ejecuta y supervisa jobs de scraping asistidos por IA.');
  }

  ngOnInit(): void {
    this.jobsStore.loadJobs();
    this.metricsStore.load();
  }

  ngOnDestroy(): void {
    this.seo.reset();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { url, instruction } = this.form.getRawValue();
    this.jobsStore.createJob({ url: url.trim(), instruction: instruction.trim() });
    this.form.reset({ url: '', instruction: '' });
  }

  saveKey(value: string): void {
    this.connection.setApiKey(value);
  }

  clearKey(): void {
    this.connection.clearApiKey();
  }
}
