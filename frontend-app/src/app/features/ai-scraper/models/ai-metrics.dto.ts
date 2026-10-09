/** Shape tolerante del backend `ai_scraper_executor` para métricas/salud (`R-NC-9`). */

export interface BackendStoreStatsDTO {
  jobsTotal?: unknown;
  jobs_total?: unknown;
  jobsByStatus?: unknown;
  jobs_by_status?: unknown;
  resultsTotal?: unknown;
  results_total?: unknown;
  pagesTotal?: unknown;
  pages_total?: unknown;
  commandsTotal?: unknown;
  commands_total?: unknown;
  commandsRecovered?: unknown;
  commands_recovered?: unknown;
  aiCallsTotal?: unknown;
  ai_calls_total?: unknown;
  aiTokensTotal?: unknown;
  ai_tokens_total?: unknown;
}

export interface BackendMetricsDTO {
  instance?: unknown;
  uptimeSec?: unknown;
  uptime_sec?: unknown;
  store?: unknown;
  queue?: unknown;
  pendingJobs?: unknown;
  pending_jobs?: unknown;
  stats?: unknown;
  aiRecoveryRate?: unknown;
  ai_recovery_rate?: unknown;
  distributed?: unknown;
}

export interface BackendHealthDTO {
  status?: unknown;
  service?: unknown;
  time?: unknown;
  checks?: unknown;
}
