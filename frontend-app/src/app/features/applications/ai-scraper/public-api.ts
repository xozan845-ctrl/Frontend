/**
 * API de aplicación pública del feature `ai-scraper` (`R-CX-6`): modelos y
 * stores consumibles por otros dominios. No importar sus rutas internas.
 */
export type { AiJob, AiJobStatus, AiResultItem } from './models/ai-job.model';
export type { AiSession, AiSessionStatus } from './models/ai-session.model';
export { AiJobsStore } from './state/ai-jobs/ai-jobs.store';
export { AiSessionStore } from './state/ai-session/ai-session.store';
export { AiConnectionStore } from './state/ai-connection/ai-connection.store';
