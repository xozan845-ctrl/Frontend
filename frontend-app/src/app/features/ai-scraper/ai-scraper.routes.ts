import { Routes } from '@angular/router';
import { AiJobsStore } from './state/ai-jobs.store';
import { AiSessionStore } from './state/ai-session.store';
import { AiMetricsStore } from './state/ai-metrics.store';
import { AiRadiographyStore } from './state/ai-radiography.store';
import { AI_JOB_REPOSITORY } from './repositories/ai-job.repository';
import { AI_SESSION_REPOSITORY } from './repositories/ai-session.repository';
import { AI_METRICS_REPOSITORY } from './repositories/ai-metrics.repository';
import { AI_RADIOGRAPHY_REPOSITORY } from './repositories/ai-radiography.repository';
import { AiJobService } from './services/ai-job.service';
import { AiSessionService } from './services/ai-session.service';
import { AiMetricsService } from './services/ai-metrics.service';
import { AiRadiographyService } from './services/ai-radiography.service';

/**
 * Rutas del feature `ai-scraper` (`R-AR-12`, `R-LZ-1`). El feature se carga con
 * `loadChildren` desde `app.routes.ts`; aquí se cablean los **puertos + DI**
 * (`R-AR-3`) y se proveen los **stores de feature** (`R-ST-6`) para que su estado
 * viva mientras el usuario navega dentro del feature y no en el bundle inicial.
 */
export const AI_SCRAPER_ROUTES: Routes = [
  {
    path: '',
    providers: [
      AiJobsStore,
      AiSessionStore,
      AiMetricsStore,
      AiRadiographyStore,
      { provide: AI_JOB_REPOSITORY, useExisting: AiJobService },
      { provide: AI_SESSION_REPOSITORY, useExisting: AiSessionService },
      { provide: AI_METRICS_REPOSITORY, useExisting: AiMetricsService },
      { provide: AI_RADIOGRAPHY_REPOSITORY, useExisting: AiRadiographyService },
    ],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/ai-dashboard/ai-dashboard.component'),
      },
      {
        path: 'jobs/:id',
        loadComponent: () => import('./pages/ai-job-detail/ai-job-detail.component'),
      },
      {
        path: 'chat',
        loadComponent: () => import('./pages/ai-chat/ai-chat.component'),
      },
      {
        path: 'radiography',
        loadComponent: () => import('./pages/ai-radiography/ai-radiography.component'),
      },
    ],
  },
];
