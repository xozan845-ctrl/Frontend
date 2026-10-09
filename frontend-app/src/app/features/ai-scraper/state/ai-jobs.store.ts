import { inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, forkJoin, of, pipe, timer } from 'rxjs';
import { catchError, distinctUntilChanged, switchMap, take, takeWhile, tap } from 'rxjs/operators';
import {
  AiCreateJobInput,
  AiJob,
  AiJobExecution,
  AiJobInteractions,
  AiJobResults,
  isAiJobActive,
} from '../models/ai-job.model';
import { AI_JOB_REPOSITORY } from '../repositories/ai-job.repository';
import { NotificationService } from '../../../core/services/notification.service';
import {
  AI_SCRAPER_POLL_MAX_ATTEMPTS,
  AI_SCRAPER_POLL_MS,
} from '../constants/ai-scraper.constants';

export interface AiJobsState {
  items: AiJob[];
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  statusFilter: string;
  creating: boolean;
  selected: AiJob | null;
  results: AiJobResults | null;
  execution: AiJobExecution | null;
  interactions: AiJobInteractions | null;
  detailLoading: boolean;
  detailError: string | null;
}

const initialState: AiJobsState = {
  items: [],
  nextCursor: null,
  loading: false,
  loadingMore: false,
  error: null,
  statusFilter: 'ALL',
  creating: false,
  selected: null,
  results: null,
  execution: null,
  interactions: null,
  detailLoading: false,
  detailError: null,
};

/** Genera una clave de idempotencia estable para `POST /jobs` (`R-DI-2`). */
function newIdempotencyKey(): string {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef && typeof cryptoRef.randomUUID === 'function') {
    return cryptoRef.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Estado de los jobs de scraping (`R-AR-5`, `R-ST-*`). Es un store **de feature**
 * (se provee en la ruta lazy); el HTTP se orquesta con `rxMethod` y el **polling**
 * de estados asíncronos se hace con `timer` + `switchMap` (nunca `setInterval`,
 * `R-PF-6`), deteniéndose al alcanzar un estado terminal o el tope de intentos.
 */
export const AiJobsStore = signalStore(
  withState(initialState),
  withComputed(({ items, selected, statusFilter }) => ({
    total: () => items().length,
    hasJobs: () => items().length > 0,
    isSelectedActive: () => (selected() ? isAiJobActive(selected()!.status) : false),
    filtered: () => {
      const filter = statusFilter();
      return filter === 'ALL' ? items() : items().filter((job) => job.status === filter);
    },
  })),
  withMethods(
    (store, jobRepo = inject(AI_JOB_REPOSITORY), notification = inject(NotificationService)) => {
      const loadJobs = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            jobRepo
              .listJobs({
                limit: 50,
                status: store.statusFilter() === 'ALL' ? undefined : store.statusFilter(),
              })
              .pipe(
                tap((list) =>
                  patchState(store, {
                    items: list.items,
                    nextCursor: list.nextCursor,
                    loading: false,
                  }),
                ),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudieron cargar los jobs.';
                  patchState(store, { loading: false, error: message });
                  notification.showError(message);
                  return EMPTY;
                }),
              ),
          ),
        ),
      );

      const loadMore = rxMethod<void>(
        pipe(
          switchMap(() => {
            const cursor = store.nextCursor();
            if (!cursor) return EMPTY;
            patchState(store, { loadingMore: true });
            return jobRepo
              .listJobs({
                limit: 50,
                cursor,
                status: store.statusFilter() === 'ALL' ? undefined : store.statusFilter(),
              })
              .pipe(
                tap((list) =>
                  patchState(store, {
                    items: [...store.items(), ...list.items],
                    nextCursor: list.nextCursor,
                    loadingMore: false,
                  }),
                ),
                catchError((err: Error) => {
                  patchState(store, { loadingMore: false });
                  notification.showError(err.message || 'No se pudieron cargar más jobs.');
                  return EMPTY;
                }),
              );
          }),
        ),
      );

      /** Polling reactivo del job seleccionado hasta un estado terminal. */
      const pollSelected = rxMethod<string>(
        pipe(
          switchMap((id) =>
            timer(0, AI_SCRAPER_POLL_MS).pipe(
              take(AI_SCRAPER_POLL_MAX_ATTEMPTS),
              switchMap(() => jobRepo.getJob(id)),
              distinctUntilChanged((a, b) => a.status === b.status && a.updatedAt === b.updatedAt),
              tap((job) => patchState(store, { selected: job, detailError: null })),
              takeWhile((job) => isAiJobActive(job.status), true),
              switchMap((job) =>
                job.status === 'COMPLETED'
                  ? jobRepo.getResults(id).pipe(tap((results) => patchState(store, { results })))
                  : of(null),
              ),
              catchError((err: Error) => {
                patchState(store, {
                  detailError: err.message || 'Se perdió la conexión con el job.',
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      const selectJob = rxMethod<string>(
        pipe(
          tap((id) =>
            patchState(store, {
              detailLoading: true,
              detailError: null,
              results: null,
              execution: null,
              interactions: null,
              selected: store.items().find((job) => job.id === id) ?? null,
            }),
          ),
          switchMap((id) =>
            forkJoin({
              job: jobRepo.getJob(id),
              execution: jobRepo.getExecution(id).pipe(catchError(() => of(null))),
              interactions: jobRepo.getInteractions(id).pipe(catchError(() => of(null))),
            }).pipe(
              tap(({ job, execution, interactions }) => {
                patchState(store, { selected: job, execution, interactions, detailLoading: false });
                if (isAiJobActive(job.status)) pollSelected(id);
              }),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo cargar el job.';
                patchState(store, { detailLoading: false, detailError: message });
                notification.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      const createJob = rxMethod<AiCreateJobInput>(
        pipe(
          tap(() => patchState(store, { creating: true, error: null })),
          switchMap((input) =>
            jobRepo.createJob(input, newIdempotencyKey()).pipe(
              tap((job) => {
                patchState(store, {
                  creating: false,
                  items: [job, ...store.items()],
                  selected: job,
                });
                notification.showSuccess('Job creado. El scraping está en marcha.');
                pollSelected(job.id);
              }),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo crear el job.';
                patchState(store, { creating: false, error: message });
                notification.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      const cancelSelected = rxMethod<void>(
        pipe(
          switchMap(() => {
            const job = store.selected();
            if (!job) return EMPTY;
            return jobRepo.cancelJob(job.id).pipe(
              tap((updated) => {
                patchState(store, { selected: updated });
                notification.showInfo('Job cancelado.');
              }),
              catchError((err: Error) => {
                notification.showError(err.message || 'No se pudo cancelar el job.');
                return EMPTY;
              }),
            );
          }),
        ),
      );

      const retrySelected = rxMethod<void>(
        pipe(
          switchMap(() => {
            const job = store.selected();
            if (!job) return EMPTY;
            return jobRepo.retryJob(job.id).pipe(
              tap((updated) => {
                patchState(store, { selected: updated });
                notification.showInfo('Job reencolado.');
                if (isAiJobActive(updated.status)) pollSelected(updated.id);
              }),
              catchError((err: Error) => {
                notification.showError(err.message || 'No se pudo reintentar el job.');
                return EMPTY;
              }),
            );
          }),
        ),
      );

      return {
        loadJobs,
        loadMore,
        selectJob,
        createJob,
        cancelSelected,
        retrySelected,

        /** Cambia el filtro por estado y recarga la lista. */
        setStatusFilter(status: string): void {
          patchState(store, { statusFilter: status });
          loadJobs();
        },

        /** Limpia el job seleccionado (al salir del detalle). */
        clearSelected(): void {
          patchState(store, { selected: null, results: null, execution: null, interactions: null });
        },
      };
    },
  ),
);
