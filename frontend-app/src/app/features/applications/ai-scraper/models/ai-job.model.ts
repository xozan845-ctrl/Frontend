/**
 * Modelo de dominio de un job de scraping de `ai_scraper_executor` (`R-CX-4`).
 * Es estable: no conoce envelopes, snake_case ni DTOs de backend (`R-AR-4`).
 */

export type AiJobStatus =
  | 'CREATED'
  | 'QUEUED'
  | 'PLANNING'
  | 'EXPLORING'
  | 'EXECUTING'
  | 'RECOVERING'
  | 'INTERPRETING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'TIMEOUT';

const TERMINAL_STATUSES: ReadonlySet<string> = new Set([
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'TIMEOUT',
]);

/** ¿El job está en un estado final (dejará de cambiar)? */
export function isAiJobTerminal(status: string | null | undefined): boolean {
  return typeof status === 'string' && TERMINAL_STATUSES.has(status);
}

/** ¿El job sigue en curso (toca seguir haciendo polling)? */
export function isAiJobActive(status: string | null | undefined): boolean {
  return !isAiJobTerminal(status);
}

/** Presupuesto de un job (`R-ST-5`); el servidor lo recorta a `HARD_LIMITS`. */
export interface AiJobLimits {
  maxPages?: number;
  maxDepth?: number;
  maxItems?: number;
  maxRuntimeSec?: number;
  maxRequests?: number;
  maxAiTokens?: number;
}

/** Proveedor/modelo de IA elegidos para un job. */
export interface AiJobAiSelection {
  provider?: 'openrouter' | 'custom';
  model?: string;
}

/** Trazabilidad de un dato extraído (`_source` del backend). */
export interface AiResultSource {
  url: string;
  selector?: string;
  scrapedAt?: string;
  confidence?: number;
}

/** Item extraído: campos libres + su procedencia. */
export interface AiResultItem {
  [key: string]: unknown;
  _source?: AiResultSource;
}

export interface AiJob {
  id: string;
  url: string;
  instruction: string;
  status: AiJobStatus;
  aiProvider: string;
  aiModel: string | null;
  createdAt: string;
  updatedAt: string;
  limits: AiJobLimits | null;
}

export interface AiJobList {
  items: AiJob[];
  nextCursor: string | null;
}

export interface AiJobResults {
  jobId: string;
  status: AiJobStatus;
  count: number;
  items: AiResultItem[];
}

export interface AiJobCommand {
  id: string;
  type: string;
  status: string;
  createdAt?: string;
  payload?: unknown;
}

export interface AiJobPage {
  id: string;
  url: string;
  title?: string;
  depth?: number;
}

export interface AiJobError {
  id?: string;
  message: string;
  context?: unknown;
  createdAt?: string;
}

export interface AiJobExecution {
  jobId: string;
  status: AiJobStatus;
  commands: AiJobCommand[];
  pages: AiJobPage[];
  errors: AiJobError[];
}

export interface AiInteraction {
  id: string;
  provider: string;
  model: string | null;
  kind: string;
  tokens: number | null;
  latencyMs: number | null;
  createdAt?: string;
}

export interface AiJobInteractions {
  jobId: string;
  provider: string;
  model: string | null;
  count: number;
  calls: AiInteraction[];
}

/** Entrada de aplicación para crear un job (`R-CX-5`, nombre de dominio). */
export interface AiCreateJobInput {
  url: string;
  instruction: string;
  limits?: AiJobLimits;
  ai?: AiJobAiSelection;
  priority?: number;
}
