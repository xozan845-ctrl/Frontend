import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AiCreateJobInput, AiJob, AiJobList } from '../models/ai-job.model';
import { AiJobListOptions, AiJobRepository } from '../repositories/ai-job.repository';
import { AI_SCRAPER_ENDPOINTS } from '../constants/ai-scraper.constants';
import {
  adaptJobExecutionFromBackend,
  adaptJobFromBackend,
  adaptJobInteractionsFromBackend,
  adaptJobListFromBackend,
  adaptJobResultsFromBackend,
} from '../adapters/ai-scraper.adapter';
import { AiScraperClient } from './ai-scraper-client.service';
import { fail, requireValue } from './ai-scraper-error';

/** Convierte la entrada de dominio al cuerpo que espera `POST /jobs`. */
function toBackendJobPayload(input: AiCreateJobInput): Record<string, unknown> {
  const body: Record<string, unknown> = { url: input.url, instruction: input.instruction };
  if (input.limits) body['limits'] = input.limits;
  if (input.ai) body['ai'] = input.ai;
  if (input.priority !== undefined) body['priority'] = input.priority;
  return body;
}

function buildQuery(options: AiJobListOptions): string {
  const params = new URLSearchParams();
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.cursor) params.set('cursor', options.cursor);
  if (options.status) params.set('status', options.status);
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Implementación HTTP del puerto de jobs (`R-CX-2`). */
@Injectable({
  providedIn: 'root',
})
export class AiJobService implements AiJobRepository {
  private readonly client = inject(AiScraperClient);

  createJob(input: AiCreateJobInput, idempotencyKey?: string): Observable<AiJob> {
    return this.client
      .post(
        AI_SCRAPER_ENDPOINTS.jobs,
        toBackendJobPayload(input),
        idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      )
      .pipe(
        map((raw) =>
          requireValue(adaptJobFromBackend(raw), 'El backend devolvió un job inválido.'),
        ),
        fail('No se pudo crear el job.'),
      );
  }

  listJobs(options: AiJobListOptions = {}): Observable<AiJobList> {
    return this.client
      .get(`${AI_SCRAPER_ENDPOINTS.jobs}${buildQuery(options)}`)
      .pipe(map(adaptJobListFromBackend), fail('No se pudieron cargar los jobs.'));
  }

  getJob(id: string): Observable<AiJob> {
    return this.client.get(`${AI_SCRAPER_ENDPOINTS.jobs}/${id}`).pipe(
      map((raw) => requireValue(adaptJobFromBackend(raw), 'Job no encontrado.')),
      fail('No se pudo cargar el job.'),
    );
  }

  getResults(id: string) {
    return this.client
      .get(`${AI_SCRAPER_ENDPOINTS.jobs}/${id}/results`)
      .pipe(map(adaptJobResultsFromBackend), fail('No se pudieron cargar los resultados.'));
  }

  getExecution(id: string) {
    return this.client
      .get(`${AI_SCRAPER_ENDPOINTS.jobs}/${id}/execution`)
      .pipe(map(adaptJobExecutionFromBackend), fail('No se pudo cargar la ejecución.'));
  }

  getInteractions(id: string, limit = 50) {
    return this.client
      .get(`${AI_SCRAPER_ENDPOINTS.jobs}/${id}/ai?limit=${limit}`)
      .pipe(
        map(adaptJobInteractionsFromBackend),
        fail('No se pudieron cargar las llamadas de IA.'),
      );
  }

  cancelJob(id: string): Observable<AiJob> {
    return this.client.post(`${AI_SCRAPER_ENDPOINTS.jobs}/${id}/cancel`, {}).pipe(
      map((raw) => requireValue(adaptJobFromBackend(raw), 'No se pudo cancelar el job.')),
      fail('No se pudo cancelar el job.'),
    );
  }

  retryJob(id: string): Observable<AiJob> {
    return this.client.post(`${AI_SCRAPER_ENDPOINTS.jobs}/${id}/retry`, {}).pipe(
      map((raw) => requireValue(adaptJobFromBackend(raw), 'No se pudo reintentar el job.')),
      fail('No se pudo reintentar el job.'),
    );
  }
}
