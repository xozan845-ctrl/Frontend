import { describe, expect, it } from 'vitest';
import {
  adaptJobFromBackend,
  adaptJobListFromBackend,
  adaptJobResultsFromBackend,
  adaptMetricsFromBackend,
  adaptSessionDetailFromBackend,
} from './ai-scraper.adapter';
import {
  BACKEND_JOB_CAMEL,
  BACKEND_JOB_LIST,
  BACKEND_JOB_RESULTS,
  BACKEND_METRICS,
  BACKEND_SESSION_DETAIL,
} from './fixtures/ai-scraper.fixture';

/**
 * Contrato frontend ↔ `ai_scraper_executor` (`R-C-1/3/4/8`). Los fixtures
 * versionados (`fixtures/ai-scraper.fixture.ts`) representan respuestas reales de
 * `/api/v1`; si el backend cambia de forma, estos tests fallan.
 */
describe('contrato con ai_scraper_executor', () => {
  it('debe soportar el envelope { items, nextCursor } del backend', () => {
    const list = adaptJobListFromBackend(BACKEND_JOB_LIST);
    expect(list.items).toHaveLength(2);
    expect(list.nextCursor).toBe('job-2');
  });

  it('debe exponer el modelo de dominio sin envelope ni campos internos', () => {
    const job = adaptJobFromBackend(BACKEND_JOB_CAMEL);
    expect(job).not.toHaveProperty('ownerScope');
    expect(job).not.toHaveProperty('data');
    expect(Object.keys(job ?? {})).toEqual(
      expect.arrayContaining(['id', 'url', 'instruction', 'status', 'aiProvider']),
    );
  });

  it('debe normalizar los items de resultado a un objeto plano con _source', () => {
    const results = adaptJobResultsFromBackend(BACKEND_JOB_RESULTS);
    expect(Array.isArray(results.items)).toBe(true);
    expect(results.items[0]).toHaveProperty('name');
    expect(results.items[0]).toHaveProperty('_source');
  });

  it('debe mantener las fechas en ISO 8601 UTC', () => {
    const job = adaptJobFromBackend(BACKEND_JOB_CAMEL);
    expect(job?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
  });

  it('debe exponer el historial de sesión ya normalizado', () => {
    const detail = adaptSessionDetailFromBackend(BACKEND_SESSION_DETAIL);
    expect(detail?.messages[0]).toHaveProperty('role');
    expect(detail?.messages[0]).toHaveProperty('content');
  });

  it('debe normalizar las métricas del backend a contadores numéricos', () => {
    const metrics = adaptMetricsFromBackend(BACKEND_METRICS);
    expect(typeof metrics.stats.jobsTotal).toBe('number');
    expect(typeof metrics.pendingJobs).toBe('number');
  });
});
