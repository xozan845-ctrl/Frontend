/** Shape tolerante del backend `ai_scraper_executor` para sesiones (`R-NC-9`). */

export interface BackendSessionDTO {
  id?: unknown;
  url?: unknown;
  domain?: unknown;
  status?: unknown;
  error?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
  updatedAt?: unknown;
  updated_at?: unknown;
  messages?: unknown;
  profile?: unknown;
}

export interface BackendSessionMessageDTO {
  id?: unknown;
  role?: unknown;
  content?: unknown;
  jobId?: unknown;
  job_id?: unknown;
  jobStatus?: unknown;
  job_status?: unknown;
  results?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
}

export interface BackendSessionProfileDTO {
  domain?: unknown;
  isJavaScriptHeavy?: unknown;
  is_javascript_heavy?: unknown;
  selectors?: unknown;
  stats?: unknown;
}

export interface BackendSessionStatusDTO {
  id?: unknown;
  status?: unknown;
  error?: unknown;
}

export interface BackendSendMessageDTO {
  message?: unknown;
  jobId?: unknown;
  job_id?: unknown;
  jobStatus?: unknown;
  job_status?: unknown;
}
