import {
  AiInteraction,
  AiJob,
  AiJobCommand,
  AiJobError,
  AiJobExecution,
  AiJobInteractions,
  AiJobLimits,
  AiJobList,
  AiJobPage,
  AiJobResults,
  AiJobStatus,
  AiResultItem,
  AiResultSource,
} from '../models/ai-job.model';
import {
  AiSession,
  AiSessionDetail,
  AiSessionMessage,
  AiSessionProfile,
  AiSessionStatus,
  AiSessionStatusResponse,
  AiSendMessageResult,
} from '../models/ai-session.model';
import { AiLearnedProfile, AiRadiographyResult } from '../models/ai-radiography.model';
import { AiHealth, AiMetrics, AiStoreStats } from '../models/ai-metrics.model';
import {
  BackendJobCommandDTO,
  BackendJobDTO,
  BackendJobErrorDTO,
  BackendJobExecutionDTO,
  BackendJobInteractionsDTO,
  BackendJobListDTO,
  BackendJobPageDTO,
  BackendJobResultsDTO,
  BackendInteractionDTO,
} from '../models/ai-job.dto';
import {
  BackendSendMessageDTO,
  BackendSessionDTO,
  BackendSessionMessageDTO,
  BackendSessionProfileDTO,
  BackendSessionStatusDTO,
} from '../models/ai-session.dto';
import { BackendLearnedProfileDTO, BackendRadiographyDTO } from '../models/ai-radiography.dto';
import {
  BackendHealthDTO,
  BackendMetricsDTO,
  BackendStoreStatsDTO,
} from '../models/ai-metrics.dto';

// --- Helpers de estrechamiento (R-NC-10: `unknown` + narrowing, sin `any`) ---

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    const str = asString(value);
    if (str !== null) return str;
  }
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const num = asNumber(value);
    if (num !== null) return num;
  }
  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function numberMap(value: unknown): Record<string, number> {
  const record = asRecord(value);
  if (!record) return {};
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(record)) {
    const num = asNumber(raw);
    if (num !== null) out[key] = num;
  }
  return out;
}

// --- Estados ---

const JOB_STATUSES: ReadonlySet<string> = new Set([
  'CREATED',
  'QUEUED',
  'PLANNING',
  'EXPLORING',
  'EXECUTING',
  'RECOVERING',
  'INTERPRETING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'TIMEOUT',
]);

/** Normaliza el estado del job; cualquier valor desconocido cae a `CREATED`. */
export function adaptJobStatusFromBackend(value: unknown): AiJobStatus {
  const status = asString(value)?.toUpperCase();
  return status && JOB_STATUSES.has(status) ? (status as AiJobStatus) : 'CREATED';
}

/** Normaliza el estado de sesión; cualquier valor desconocido cae a `RADIOGRAPHY`. */
export function adaptSessionStatusFromBackend(value: unknown): AiSessionStatus {
  const status = asString(value)?.toUpperCase();
  return status === 'READY' || status === 'FAILED' || status === 'RADIOGRAPHY'
    ? status
    : 'RADIOGRAPHY';
}

// --- Jobs ---

export function adaptLimitsFromBackend(raw: unknown): AiJobLimits | null {
  const dto = asRecord(raw);
  if (!dto) return null;
  const limits: AiJobLimits = {};
  const pairs: Array<[keyof AiJobLimits, unknown]> = [
    ['maxPages', dto['maxPages'] ?? dto['max_pages']],
    ['maxDepth', dto['maxDepth'] ?? dto['max_depth']],
    ['maxItems', dto['maxItems'] ?? dto['max_items']],
    ['maxRuntimeSec', dto['maxRuntimeSec'] ?? dto['max_runtime_sec']],
    ['maxRequests', dto['maxRequests'] ?? dto['max_requests']],
    ['maxAiTokens', dto['maxAiTokens'] ?? dto['max_ai_tokens']],
  ];
  for (const [key, value] of pairs) {
    const num = asNumber(value);
    if (num !== null) limits[key] = num;
  }
  return Object.keys(limits).length > 0 ? limits : null;
}

export function adaptJobFromBackend(raw: unknown): AiJob | null {
  const dto = asRecord(raw) as BackendJobDTO | null;
  if (!dto) return null;
  const id = firstString(dto.id, dto._id);
  if (!id) return null;
  const now = new Date().toISOString();
  return {
    id,
    url: firstString(dto.url) ?? '',
    instruction: firstString(dto.instruction) ?? '',
    status: adaptJobStatusFromBackend(dto.status),
    aiProvider: firstString(dto.aiProvider, dto.ai_provider) ?? 'openrouter',
    aiModel: firstString(dto.aiModel, dto.ai_model),
    createdAt: firstString(dto.createdAt, dto.created_at) ?? now,
    updatedAt: firstString(dto.updatedAt, dto.updated_at) ?? now,
    limits: adaptLimitsFromBackend(dto.limits),
  };
}

export function adaptJobListFromBackend(response: unknown): AiJobList {
  const dto = asRecord(response) as BackendJobListDTO | null;
  const rawItems = dto && dto.items !== undefined ? dto.items : response;
  const items = asArray(rawItems)
    .map(adaptJobFromBackend)
    .filter((job): job is AiJob => job !== null);
  return {
    items,
    nextCursor: dto ? firstString(dto.nextCursor, dto.next_cursor) : null,
  };
}

function adaptResultSourceFromBackend(raw: unknown): AiResultSource | undefined {
  const dto = asRecord(raw);
  if (!dto) return undefined;
  const url = firstString(dto['url']);
  if (!url) return undefined;
  const source: AiResultSource = { url };
  const selector = firstString(dto['selector']);
  if (selector) source.selector = selector;
  const scrapedAt = firstString(dto['scrapedAt'], dto['scraped_at']);
  if (scrapedAt) source.scrapedAt = scrapedAt;
  const confidence = asNumber(dto['confidence']);
  if (confidence !== null) source.confidence = confidence;
  return source;
}

export function adaptResultItemFromBackend(raw: unknown): AiResultItem {
  const dto = asRecord(raw);
  if (!dto) return { value: raw };
  const item: AiResultItem = {};
  for (const [key, value] of Object.entries(dto)) {
    if (key === '_source') continue;
    item[key] = value;
  }
  const source = adaptResultSourceFromBackend(dto['_source']);
  if (source) item._source = source;
  return item;
}

export function adaptJobResultsFromBackend(response: unknown): AiJobResults {
  const dto = (asRecord(response) ?? {}) as BackendJobResultsDTO;
  const items = asArray(dto.items).map(adaptResultItemFromBackend);
  return {
    jobId: firstString(dto.jobId, dto.job_id) ?? '',
    status: adaptJobStatusFromBackend(dto.status),
    count: firstNumber(dto.count) ?? items.length,
    items,
  };
}

function adaptCommandFromBackend(raw: unknown): AiJobCommand {
  const dto = (asRecord(raw) ?? {}) as BackendJobCommandDTO;
  const command: AiJobCommand = {
    id: firstString(dto.id) ?? '',
    type: firstString(dto.type) ?? '',
    status: firstString(dto.status) ?? '',
  };
  const createdAt = firstString(dto.createdAt, dto.created_at);
  if (createdAt) command.createdAt = createdAt;
  if (dto.payload !== undefined) command.payload = dto.payload;
  return command;
}

function adaptPageFromBackend(raw: unknown): AiJobPage {
  const dto = (asRecord(raw) ?? {}) as BackendJobPageDTO;
  const page: AiJobPage = { id: firstString(dto.id) ?? '', url: firstString(dto.url) ?? '' };
  const title = firstString(dto.title);
  if (title) page.title = title;
  const depth = asNumber(dto.depth);
  if (depth !== null) page.depth = depth;
  return page;
}

function adaptErrorFromBackend(raw: unknown): AiJobError {
  const dto = (asRecord(raw) ?? {}) as BackendJobErrorDTO;
  const error: AiJobError = { message: firstString(dto.message) ?? 'Error desconocido' };
  const id = firstString(dto.id);
  if (id) error.id = id;
  const createdAt = firstString(dto.createdAt, dto.created_at);
  if (createdAt) error.createdAt = createdAt;
  if (dto.context !== undefined) error.context = dto.context;
  return error;
}

export function adaptJobExecutionFromBackend(response: unknown): AiJobExecution {
  const dto = (asRecord(response) ?? {}) as BackendJobExecutionDTO;
  return {
    jobId: firstString(dto.jobId, dto.job_id) ?? '',
    status: adaptJobStatusFromBackend(dto.status),
    commands: asArray(dto.commands).map(adaptCommandFromBackend),
    pages: asArray(dto.pages).map(adaptPageFromBackend),
    errors: asArray(dto.errors).map(adaptErrorFromBackend),
  };
}

function adaptInteractionFromBackend(raw: unknown): AiInteraction {
  const dto = (asRecord(raw) ?? {}) as BackendInteractionDTO;
  const interaction: AiInteraction = {
    id: firstString(dto.id) ?? '',
    provider: firstString(dto.provider) ?? '',
    model: firstString(dto.model),
    kind: firstString(dto.kind) ?? '',
    tokens: asNumber(dto.tokens),
    latencyMs: firstNumber(dto.latencyMs, dto.latency_ms),
  };
  const createdAt = firstString(dto.createdAt, dto.created_at);
  if (createdAt) interaction.createdAt = createdAt;
  return interaction;
}

export function adaptJobInteractionsFromBackend(response: unknown): AiJobInteractions {
  const dto = (asRecord(response) ?? {}) as BackendJobInteractionsDTO;
  const calls = asArray(dto.calls).map(adaptInteractionFromBackend);
  return {
    jobId: firstString(dto.jobId, dto.job_id) ?? '',
    provider: firstString(dto.provider) ?? '',
    model: firstString(dto.model),
    count: firstNumber(dto.count) ?? calls.length,
    calls,
  };
}

// --- Sesiones (chat) ---

export function adaptSessionFromBackend(raw: unknown): AiSession | null {
  const dto = asRecord(raw) as BackendSessionDTO | null;
  if (!dto) return null;
  const id = firstString(dto.id);
  if (!id) return null;
  const now = new Date().toISOString();
  return {
    id,
    url: firstString(dto.url) ?? '',
    domain: firstString(dto.domain) ?? '',
    status: adaptSessionStatusFromBackend(dto.status),
    error: firstString(dto.error),
    createdAt: firstString(dto.createdAt, dto.created_at) ?? now,
    updatedAt: firstString(dto.updatedAt, dto.updated_at) ?? now,
  };
}

export function adaptSessionListFromBackend(response: unknown): AiSession[] {
  return asArray(response)
    .map(adaptSessionFromBackend)
    .filter((session): session is AiSession => session !== null);
}

export function adaptSessionMessageFromBackend(raw: unknown): AiSessionMessage {
  const dto = (asRecord(raw) ?? {}) as BackendSessionMessageDTO;
  const jobStatus = firstString(dto.jobStatus, dto.job_status);
  const results = dto.results;
  const message: AiSessionMessage = {
    id: firstString(dto.id) ?? '',
    role: firstString(dto.role) === 'assistant' ? 'assistant' : 'user',
    content: firstString(dto.content) ?? '',
    jobId: firstString(dto.jobId, dto.job_id),
    jobStatus: jobStatus ? adaptJobStatusFromBackend(jobStatus) : null,
    results: Array.isArray(results) ? results.map(adaptResultItemFromBackend) : null,
  };
  const createdAt = firstString(dto.createdAt, dto.created_at);
  if (createdAt) message.createdAt = createdAt;
  return message;
}

export function adaptSessionProfileFromBackend(raw: unknown): AiSessionProfile | null {
  const dto = asRecord(raw) as BackendSessionProfileDTO | null;
  if (!dto) return null;
  const profile: AiSessionProfile = {};
  const domain = firstString(dto.domain);
  if (domain) profile.domain = domain;
  const jsHeavy = asBoolean(dto.isJavaScriptHeavy ?? dto.is_javascript_heavy);
  if (jsHeavy !== null) profile.isJavaScriptHeavy = jsHeavy;
  if (dto.selectors !== undefined) profile.selectors = dto.selectors;
  const stats = asRecord(dto.stats);
  if (stats) {
    profile.stats = {
      totalJobs: firstNumber(stats['totalJobs'], stats['total_jobs']) ?? undefined,
      successfulJobs: firstNumber(stats['successfulJobs'], stats['successful_jobs']) ?? undefined,
    };
  }
  return profile;
}

export function adaptSessionDetailFromBackend(response: unknown): AiSessionDetail | null {
  const base = adaptSessionFromBackend(response);
  if (!base) return null;
  const dto = (asRecord(response) ?? {}) as BackendSessionDTO;
  return {
    ...base,
    messages: asArray(dto.messages).map(adaptSessionMessageFromBackend),
    profile: adaptSessionProfileFromBackend(dto.profile),
  };
}

export function adaptSessionStatusResponseFromBackend(
  response: unknown,
): AiSessionStatusResponse | null {
  const dto = asRecord(response) as BackendSessionStatusDTO | null;
  if (!dto) return null;
  const id = firstString(dto.id);
  if (!id) return null;
  return {
    id,
    status: adaptSessionStatusFromBackend(dto.status),
    error: firstString(dto.error),
  };
}

export function adaptSendMessageFromBackend(response: unknown): AiSendMessageResult | null {
  const dto = asRecord(response) as BackendSendMessageDTO | null;
  if (!dto) return null;
  const jobId = firstString(dto.jobId, dto.job_id);
  if (!jobId) return null;
  const jobStatus = firstString(dto.jobStatus, dto.job_status);
  return {
    message: adaptSessionMessageFromBackend(dto.message),
    jobId,
    jobStatus: jobStatus ? adaptJobStatusFromBackend(jobStatus) : 'QUEUED',
  };
}

// --- Radiografía / memoria ---

export function adaptRadiographyFromBackend(response: unknown): AiRadiographyResult {
  const dto = (asRecord(response) ?? {}) as BackendRadiographyDTO;
  return {
    domain: firstString(dto.domain) ?? '',
    profileId: firstString(dto.profileId, dto.profile_id) ?? '',
    discovered: firstNumber(dto.discovered) ?? 0,
    radiography: dto.radiography ?? null,
  };
}

export function adaptLearnedProfileFromBackend(response: unknown): AiLearnedProfile {
  const dto = (asRecord(response) ?? {}) as BackendLearnedProfileDTO;
  return {
    shouldUseBrowser: asBoolean(dto.shouldUseBrowser ?? dto.should_use_browser) ?? false,
    recommendedSelectors: dto.recommendedSelectors ?? dto.recommended_selectors ?? null,
    profile: dto.profile ?? null,
  };
}

// --- Métricas / salud ---

function adaptStoreStatsFromBackend(raw: unknown): AiStoreStats {
  const dto = (asRecord(raw) ?? {}) as BackendStoreStatsDTO;
  return {
    jobsTotal: firstNumber(dto.jobsTotal, dto.jobs_total) ?? 0,
    jobsByStatus: numberMap(dto.jobsByStatus ?? dto.jobs_by_status),
    resultsTotal: firstNumber(dto.resultsTotal, dto.results_total) ?? 0,
    pagesTotal: firstNumber(dto.pagesTotal, dto.pages_total) ?? 0,
    commandsTotal: firstNumber(dto.commandsTotal, dto.commands_total) ?? 0,
    commandsRecovered: firstNumber(dto.commandsRecovered, dto.commands_recovered) ?? 0,
    aiCallsTotal: firstNumber(dto.aiCallsTotal, dto.ai_calls_total) ?? 0,
    aiTokensTotal: firstNumber(dto.aiTokensTotal, dto.ai_tokens_total) ?? 0,
  };
}

export function adaptMetricsFromBackend(response: unknown): AiMetrics {
  const dto = (asRecord(response) ?? {}) as BackendMetricsDTO;
  return {
    instance: firstString(dto.instance) ?? '',
    uptimeSec: firstNumber(dto.uptimeSec, dto.uptime_sec) ?? 0,
    store: firstString(dto.store) ?? '',
    queue: firstString(dto.queue) ?? '',
    pendingJobs: firstNumber(dto.pendingJobs, dto.pending_jobs) ?? 0,
    stats: adaptStoreStatsFromBackend(dto.stats),
    aiRecoveryRate: firstNumber(dto.aiRecoveryRate, dto.ai_recovery_rate) ?? 0,
    distributed: numberMap(dto.distributed),
  };
}

export function adaptHealthFromBackend(response: unknown): AiHealth {
  const dto = (asRecord(response) ?? {}) as BackendHealthDTO;
  const checksRecord = asRecord(dto.checks);
  const checks: Record<string, string> = {};
  if (checksRecord) {
    for (const [key, value] of Object.entries(checksRecord)) {
      const str = asString(value);
      if (str !== null) checks[key] = str;
    }
  }
  return {
    status: firstString(dto.status) ?? 'unknown',
    service: firstString(dto.service) ?? '',
    time: firstString(dto.time) ?? '',
    checks,
  };
}
