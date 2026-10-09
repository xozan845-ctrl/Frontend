/** Modelo de dominio de métricas / salud de `ai_scraper_executor` (`R-CX-4`). */

export interface AiStoreStats {
  jobsTotal: number;
  jobsByStatus: Record<string, number>;
  resultsTotal: number;
  pagesTotal: number;
  commandsTotal: number;
  commandsRecovered: number;
  aiCallsTotal: number;
  aiTokensTotal: number;
}

export interface AiMetrics {
  instance: string;
  uptimeSec: number;
  store: string;
  queue: string;
  pendingJobs: number;
  stats: AiStoreStats;
  aiRecoveryRate: number;
  distributed: Record<string, number>;
}

export interface AiHealth {
  status: string;
  service: string;
  time: string;
  checks: Record<string, string>;
}
