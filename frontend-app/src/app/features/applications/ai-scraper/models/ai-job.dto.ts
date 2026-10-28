/**
 * Shape tolerante del backend `ai_scraper_executor` para jobs (`R-NC-9`).
 * Todos los campos son opcionales y `unknown` donde el backend no garantiza el
 * tipo; los adapters los estrechan (`R-NC-10`).
 */

export interface BackendJobLimitsDTO {
  maxPages?: unknown;
  maxDepth?: unknown;
  maxItems?: unknown;
  maxRuntimeSec?: unknown;
  maxRequests?: unknown;
  maxAiTokens?: unknown;
}

export interface BackendJobDTO {
  id?: unknown;
  _id?: unknown;
  url?: unknown;
  instruction?: unknown;
  status?: unknown;
  aiProvider?: unknown;
  ai_provider?: unknown;
  aiModel?: unknown;
  ai_model?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
  updatedAt?: unknown;
  updated_at?: unknown;
  limits?: unknown;
}

export interface BackendJobListDTO {
  items?: unknown;
  nextCursor?: unknown;
  next_cursor?: unknown;
}

export interface BackendResultSourceDTO {
  url?: unknown;
  selector?: unknown;
  scrapedAt?: unknown;
  scraped_at?: unknown;
  confidence?: unknown;
}

export interface BackendResultItemDTO {
  [key: string]: unknown;
  _source?: BackendResultSourceDTO;
}

export interface BackendJobResultsDTO {
  jobId?: unknown;
  job_id?: unknown;
  status?: unknown;
  count?: unknown;
  items?: unknown;
}

export interface BackendJobCommandDTO {
  id?: unknown;
  type?: unknown;
  status?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
  payload?: unknown;
}

export interface BackendJobPageDTO {
  id?: unknown;
  url?: unknown;
  title?: unknown;
  depth?: unknown;
}

export interface BackendJobErrorDTO {
  id?: unknown;
  message?: unknown;
  context?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
}

export interface BackendJobExecutionDTO {
  jobId?: unknown;
  job_id?: unknown;
  status?: unknown;
  commands?: unknown;
  pages?: unknown;
  errors?: unknown;
}

export interface BackendInteractionDTO {
  id?: unknown;
  provider?: unknown;
  model?: unknown;
  kind?: unknown;
  tokens?: unknown;
  latencyMs?: unknown;
  latency_ms?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
}

export interface BackendJobInteractionsDTO {
  jobId?: unknown;
  job_id?: unknown;
  provider?: unknown;
  model?: unknown;
  count?: unknown;
  calls?: unknown;
}
