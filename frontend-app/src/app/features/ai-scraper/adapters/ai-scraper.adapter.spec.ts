import { describe, expect, it } from 'vitest';
import {
  adaptHealthFromBackend,
  adaptJobExecutionFromBackend,
  adaptJobFromBackend,
  adaptJobInteractionsFromBackend,
  adaptJobListFromBackend,
  adaptJobResultsFromBackend,
  adaptJobStatusFromBackend,
  adaptLearnedProfileFromBackend,
  adaptLimitsFromBackend,
  adaptMetricsFromBackend,
  adaptRadiographyFromBackend,
  adaptResultItemFromBackend,
  adaptSendMessageFromBackend,
  adaptSessionDetailFromBackend,
  adaptSessionFromBackend,
  adaptSessionListFromBackend,
  adaptSessionProfileFromBackend,
  adaptSessionStatusFromBackend,
  adaptSessionStatusResponseFromBackend,
} from './ai-scraper.adapter';
import { isAiJobActive, isAiJobTerminal } from '../models/ai-job.model';
import {
  BACKEND_HEALTH,
  BACKEND_INTERACTIONS,
  BACKEND_JOB_CAMEL,
  BACKEND_JOB_EXECUTION,
  BACKEND_JOB_LIST,
  BACKEND_JOB_RESULTS,
  BACKEND_JOB_SNAKE,
  BACKEND_LEARNED_PROFILE,
  BACKEND_METRICS,
  BACKEND_RADIOGRAPHY,
  BACKEND_SEND_MESSAGE,
  BACKEND_SESSION,
  BACKEND_SESSION_DETAIL,
  BACKEND_SESSION_LIST,
  BACKEND_SESSION_STATUS,
} from './fixtures/ai-scraper.fixture';

describe('adaptJobFromBackend', () => {
  it('debe normalizar un job en camelCase cuando el backend lo entrega así', () => {
    const job = adaptJobFromBackend(BACKEND_JOB_CAMEL);
    expect(job).toMatchObject({
      id: 'job-1',
      status: 'COMPLETED',
      aiProvider: 'openrouter',
      aiModel: 'openrouter/free',
    });
    expect(job?.limits).toMatchObject({ maxPages: 5, maxDepth: 2, maxItems: 50 });
  });

  it('debe normalizar un job en snake_case cuando el backend lo entrega así', () => {
    const job = adaptJobFromBackend(BACKEND_JOB_SNAKE);
    expect(job?.aiProvider).toBe('custom');
    expect(job?.aiModel).toBe('llama3.1:8b');
    expect(job?.limits).toMatchObject({ maxPages: 10, maxRuntimeSec: 300 });
  });

  it('debe devolver null cuando el job no trae id', () => {
    expect(adaptJobFromBackend({ url: 'https://x' })).toBeNull();
    expect(adaptJobFromBackend(null)).toBeNull();
    expect(adaptJobFromBackend('no-objeto')).toBeNull();
  });

  it('debe caer a CREATED cuando el estado es desconocido', () => {
    expect(adaptJobFromBackend({ id: 'j', status: 'INVENTADO' })?.status).toBe('CREATED');
    expect(adaptJobFromBackend({ id: 'j' })?.status).toBe('CREATED');
  });

  it('debe devolver limits null cuando no vienen límites', () => {
    expect(adaptJobFromBackend({ id: 'j' })?.limits).toBeNull();
  });
});

describe('adaptJobListFromBackend', () => {
  it('debe extraer items y nextCursor del envelope del backend', () => {
    const list = adaptJobListFromBackend(BACKEND_JOB_LIST);
    expect(list.items).toHaveLength(2);
    expect(list.nextCursor).toBe('job-2');
  });

  it('debe aceptar un array plano cuando el backend no envuelve', () => {
    const list = adaptJobListFromBackend([BACKEND_JOB_CAMEL]);
    expect(list.items).toHaveLength(1);
    expect(list.nextCursor).toBeNull();
  });

  it('debe devolver lista vacía cuando la respuesta es corrupta', () => {
    expect(adaptJobListFromBackend(null).items).toEqual([]);
    expect(adaptJobListFromBackend({ items: 'no-array' }).items).toEqual([]);
  });
});

describe('adaptJobResultsFromBackend', () => {
  it('debe mapear los items y su trazabilidad _source', () => {
    const results = adaptJobResultsFromBackend(BACKEND_JOB_RESULTS);
    expect(results.count).toBe(2);
    expect(results.items[0]['name']).toBe('Laptop Pro');
    expect(results.items[0]._source).toMatchObject({
      url: 'https://tienda.example/laptop',
      selector: '.product-card h2',
      confidence: 0.92,
    });
  });

  it('debe omitir _source cuando el item no trae url de origen', () => {
    const results = adaptJobResultsFromBackend(BACKEND_JOB_RESULTS);
    expect(results.items[1]._source).toBeUndefined();
  });

  it('debe usar el número de items cuando count falta', () => {
    const results = adaptJobResultsFromBackend({
      jobId: 'j',
      status: 'COMPLETED',
      items: [{ a: 1 }, { b: 2 }],
    });
    expect(results.count).toBe(2);
  });
});

describe('adaptJobExecutionFromBackend', () => {
  it('debe normalizar comandos, páginas y errores', () => {
    const execution = adaptJobExecutionFromBackend(BACKEND_JOB_EXECUTION);
    expect(execution.commands[0]).toMatchObject({
      id: 'cmd-1',
      type: 'EXTRACT_LIST',
      status: 'DONE',
    });
    expect(execution.pages[0]).toMatchObject({ url: 'https://tienda.example/', depth: 0 });
    expect(execution.errors).toEqual([]);
  });
});

describe('adaptJobInteractionsFromBackend', () => {
  it('debe normalizar las llamadas al LLM con tokens y latencia', () => {
    const interactions = adaptJobInteractionsFromBackend(BACKEND_INTERACTIONS);
    expect(interactions.count).toBe(1);
    expect(interactions.calls[0]).toMatchObject({
      kind: 'plan',
      tokens: 1234,
      latencyMs: 850,
    });
  });
});

describe('adaptSessionFromBackend', () => {
  it('debe normalizar una sesión del backend', () => {
    const session = adaptSessionFromBackend(BACKEND_SESSION);
    expect(session).toMatchObject({
      id: 'sess-1',
      domain: 'tienda.example',
      status: 'RADIOGRAPHY',
    });
  });

  it('debe devolver null cuando la sesión no trae id', () => {
    expect(adaptSessionFromBackend({ url: 'x' })).toBeNull();
    expect(adaptSessionFromBackend(undefined)).toBeNull();
  });

  it('debe caer a RADIOGRAPHY cuando el estado es desconocido', () => {
    expect(adaptSessionFromBackend({ id: 's', status: 'raro' })?.status).toBe('RADIOGRAPHY');
  });
});

describe('adaptSessionListFromBackend', () => {
  it('debe mapear el array de sesiones', () => {
    const sessions = adaptSessionListFromBackend(BACKEND_SESSION_LIST);
    expect(sessions).toHaveLength(2);
    expect(sessions[1].status).toBe('READY');
  });
});

describe('adaptSessionDetailFromBackend', () => {
  it('debe incluir mensajes enriquecidos y perfil aprendido', () => {
    const detail = adaptSessionDetailFromBackend(BACKEND_SESSION_DETAIL);
    expect(detail?.messages).toHaveLength(2);
    expect(detail?.messages[1]).toMatchObject({
      role: 'assistant',
      jobId: 'job-1',
      jobStatus: 'COMPLETED',
    });
    expect(detail?.messages[1].results).toHaveLength(1);
    expect(detail?.profile).toMatchObject({
      domain: 'tienda.example',
      isJavaScriptHeavy: true,
      stats: { totalJobs: 3, successfulJobs: 2 },
    });
  });
});

describe('adaptSessionStatusResponseFromBackend', () => {
  it('debe normalizar el estado de la radiografía', () => {
    expect(adaptSessionStatusResponseFromBackend(BACKEND_SESSION_STATUS)).toMatchObject({
      id: 'sess-1',
      status: 'READY',
    });
  });
});

describe('adaptSendMessageFromBackend', () => {
  it('debe devolver jobId y estado del mensaje', () => {
    const sent = adaptSendMessageFromBackend(BACKEND_SEND_MESSAGE);
    expect(sent?.jobId).toBe('job-3');
    expect(sent?.jobStatus).toBe('QUEUED');
    expect(sent?.message.jobId).toBe('job-3');
  });

  it('debe devolver null cuando falta jobId', () => {
    expect(adaptSendMessageFromBackend({ message: {} })).toBeNull();
  });
});

describe('adaptRadiographyFromBackend', () => {
  it('debe normalizar el resultado de la radiografía', () => {
    expect(adaptRadiographyFromBackend(BACKEND_RADIOGRAPHY)).toMatchObject({
      domain: 'tienda.example',
      profileId: 'prof-1',
      discovered: 12,
    });
  });
});

describe('adaptLearnedProfileFromBackend', () => {
  it('debe normalizar selectores y recomendación de navegador', () => {
    expect(adaptLearnedProfileFromBackend(BACKEND_LEARNED_PROFILE)).toMatchObject({
      shouldUseBrowser: true,
    });
  });
});

describe('adaptMetricsFromBackend', () => {
  it('debe normalizar stats, pendientes y contadores distribuidos', () => {
    const metrics = adaptMetricsFromBackend(BACKEND_METRICS);
    expect(metrics.pendingJobs).toBe(2);
    expect(metrics.stats.jobsByStatus['COMPLETED']).toBe(7);
    expect(metrics.distributed['jobs_created_total']).toBe(10);
  });
});

describe('adaptHealthFromBackend', () => {
  it('debe normalizar el health y sus checks', () => {
    const health = adaptHealthFromBackend(BACKEND_HEALTH);
    expect(health.status).toBe('ok');
    expect(health.checks['store']).toBe('prisma');
  });
});

describe('isAiJobTerminal / isAiJobActive', () => {
  it('debe reconocer los estados terminales y activos', () => {
    expect(isAiJobTerminal('COMPLETED')).toBe(true);
    expect(isAiJobTerminal('FAILED')).toBe(true);
    expect(isAiJobTerminal('EXECUTING')).toBe(false);
    expect(isAiJobActive('QUEUED')).toBe(true);
    expect(isAiJobActive('TIMEOUT')).toBe(false);
  });
});

describe('adaptación tolerante a variantes y datos corruptos (R-RB-1)', () => {
  it('debe normalizar estados con helper directo y descartar valores no textuales', () => {
    expect(adaptJobStatusFromBackend('completed')).toBe('COMPLETED');
    expect(adaptJobStatusFromBackend(42)).toBe('CREATED');
    expect(adaptSessionStatusFromBackend('failed')).toBe('FAILED');
    expect(adaptSessionStatusFromBackend(null)).toBe('RADIOGRAPHY');
  });

  it('debe devolver limits null cuando el shape no es un objeto', () => {
    expect(adaptLimitsFromBackend('nope')).toBeNull();
    expect(adaptLimitsFromBackend({ max_pages: 3 })?.maxPages).toBe(3);
  });

  it('debe usar _id como identificador cuando falta id', () => {
    expect(adaptJobFromBackend({ _id: 'mongo-1' })?.id).toBe('mongo-1');
  });

  it('debe envolver un resultado no-objeto bajo la clave value', () => {
    expect(adaptResultItemFromBackend('texto')).toEqual({ value: 'texto' });
  });

  it('debe mapear resultados con job_id y count como string', () => {
    const results = adaptJobResultsFromBackend({
      job_id: 'j',
      status: 'FAILED',
      count: '3',
      items: [],
    });
    expect(results.jobId).toBe('j');
    expect(results.status).toBe('FAILED');
    expect(results.count).toBe(3);
  });

  it('debe normalizar ejecución con errores y job_id', () => {
    const execution = adaptJobExecutionFromBackend({
      job_id: 'j',
      status: 'FAILED',
      errors: [{ message: 'boom', context: { x: 1 } }],
    });
    expect(execution.jobId).toBe('j');
    expect(execution.errors[0].message).toBe('boom');
    expect(execution.errors[0].context).toEqual({ x: 1 });
  });

  it('debe normalizar interacciones con latency_ms y sin count', () => {
    const interactions = adaptJobInteractionsFromBackend({
      job_id: 'j',
      calls: [{ kind: 'analyze', latency_ms: '500' }],
    });
    expect(interactions.jobId).toBe('j');
    expect(interactions.count).toBe(1);
    expect(interactions.calls[0].latencyMs).toBe(500);
    expect(interactions.calls[0].createdAt).toBeUndefined();
  });

  it('debe normalizar una sesión con fechas snake_case y error', () => {
    const session = adaptSessionFromBackend({
      id: 's',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
      error: 'falló',
    });
    expect(session?.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(session?.error).toBe('falló');
  });

  it('debe normalizar el perfil con snake_case, selectores y stats', () => {
    const profile = adaptSessionProfileFromBackend({
      is_javascript_heavy: 'true',
      selectors: { a: 1 },
      stats: { total_jobs: 2, successful_jobs: 1 },
    });
    expect(profile?.isJavaScriptHeavy).toBe(true);
    expect(profile?.selectors).toEqual({ a: 1 });
    expect(profile?.stats).toEqual({ totalJobs: 2, successfulJobs: 1 });
  });

  it('debe devolver perfil null cuando no viene', () => {
    expect(adaptSessionProfileFromBackend(null)).toBeNull();
    expect(adaptSessionDetailFromBackend({ id: 's' })?.profile).toBeNull();
  });

  it('debe devolver null en el status cuando falta el id', () => {
    expect(adaptSessionStatusResponseFromBackend({ status: 'READY' })).toBeNull();
  });

  it('debe normalizar send-message con snake_case y estado por defecto', () => {
    const sent = adaptSendMessageFromBackend({ job_id: 'j', message: { role: 'assistant' } });
    expect(sent?.jobId).toBe('j');
    expect(sent?.jobStatus).toBe('QUEUED');
  });

  it('debe normalizar radiografía con profile_id y vacíos por defecto', () => {
    expect(adaptRadiographyFromBackend({ profile_id: 'p' }).profileId).toBe('p');
    expect(adaptRadiographyFromBackend(null).discovered).toBe(0);
  });

  it('debe normalizar el perfil aprendido con snake_case y por defecto false', () => {
    expect(adaptLearnedProfileFromBackend({ should_use_browser: 'true' }).shouldUseBrowser).toBe(
      true,
    );
    expect(adaptLearnedProfileFromBackend({}).shouldUseBrowser).toBe(false);
  });

  it('debe normalizar métricas con snake_case y sin distribuidos', () => {
    const metrics = adaptMetricsFromBackend({
      pending_jobs: '4',
      uptime_sec: 10,
      ai_recovery_rate: 0.5,
      stats: { jobs_total: 5 },
    });
    expect(metrics.pendingJobs).toBe(4);
    expect(metrics.uptimeSec).toBe(10);
    expect(metrics.stats.jobsTotal).toBe(5);
    expect(metrics.distributed).toEqual({});
  });

  it('debe normalizar health sin checks', () => {
    const health = adaptHealthFromBackend({ status: 'ok' });
    expect(health.checks).toEqual({});
    expect(health.service).toBe('');
  });
});
