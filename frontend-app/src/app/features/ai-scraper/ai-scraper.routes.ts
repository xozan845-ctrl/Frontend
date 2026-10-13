import { Routes } from '@angular/router';
import { AiJobsStore } from './state/ai-jobs.store';
import { AiSessionStore } from './state/ai-session.store';
import { AI_JOB_REPOSITORY } from './repositories/ai-job.repository';
import { AI_SESSION_REPOSITORY } from './repositories/ai-session.repository';
import { AiJobService } from './services/ai-job.service';
import { AiSessionService } from './services/ai-session.service';

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
      { provide: AI_JOB_REPOSITORY, useExisting: AiJobService },
      { provide: AI_SESSION_REPOSITORY, useExisting: AiSessionService },
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
    ],
  },
];
