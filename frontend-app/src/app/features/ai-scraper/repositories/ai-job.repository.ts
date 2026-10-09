import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AiCreateJobInput,
  AiJob,
  AiJobExecution,
  AiJobInteractions,
  AiJobList,
  AiJobResults,
} from '../models/ai-job.model';

/**
 * Puerto de jobs del backend de IA (`R-AR-3`, `R-SO-4`). Pequeño y específico:
 * los consumidores no ven HTTP ni el shape del backend (`R-CX-2`).
 */
export interface AiJobRepository {
  /** Crea un job (idempotente si se pasa `Idempotency-Key`). */
  createJob(input: AiCreateJobInput, idempotencyKey?: string): Observable<AiJob>;
  /** Lista jobs con paginación por cursor y filtro por estado. */
  listJobs(options?: AiJobListOptions): Observable<AiJobList>;
  /** Detalle de un job. */
  getJob(id: string): Observable<AiJob>;
  /** Items extraídos por el job (con trazabilidad `_source`). */
  getResults(id: string): Observable<AiJobResults>;
  /** Comandos, páginas y errores de la ejecución. */
  getExecution(id: string): Observable<AiJobExecution>;
  /** Llamadas al LLM del job. */
  getInteractions(id: string, limit?: number): Observable<AiJobInteractions>;
  /** Cancela un job en curso (terminal seguro). */
  cancelJob(id: string): Observable<AiJob>;
  /** Reencola un job fallido. */
  retryJob(id: string): Observable<AiJob>;
}

export interface AiJobListOptions {
  limit?: number;
  cursor?: string;
  status?: string;
}

export const AI_JOB_REPOSITORY = new InjectionToken<AiJobRepository>('AiJobRepository');
