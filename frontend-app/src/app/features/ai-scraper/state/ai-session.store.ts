import { inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, of, pipe, timer, Observable } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  map,
  switchMap,
  take,
  takeWhile,
  tap,
} from 'rxjs/operators';
import {
  AiCreateSessionInput,
  AiSession,
  AiSessionDetail,
  AiSessionStatus,
  isAiSessionSettled,
} from '../models/ai-session.model';
import { isAiJobActive } from '../models/ai-job.model';
import { AI_SESSION_REPOSITORY } from '../repositories/ai-session.repository';
import { AI_JOB_REPOSITORY } from '../repositories/ai-job.repository';
import { NotificationService } from '../../../core/services/notification.service';
import {
  AI_SCRAPER_POLL_MAX_ATTEMPTS,
  AI_SCRAPER_POLL_MS,
} from '../constants/ai-scraper.constants';

export interface AiSessionState {
  sessions: AiSession[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  current: AiSessionDetail | null;
  status: AiSessionStatus | null;
  statusError: string | null;
  detailLoading: boolean;
  sending: boolean;
}

const initialState: AiSessionState = {
  sessions: [],
  loading: false,
  error: null,
  creating: false,
  current: null,
  status: null,
  statusError: null,
  detailLoading: false,
  sending: false,
};

/**
 * Estado del chat por sesión (`R-AR-5`, `R-ST-*`). Orquesta el flujo
 * **crear → poll de radiografía hasta READY → enviar mensaje → poll del job**,
 * con `rxMethod` y `timer` (sin `setInterval`, `R-PF-6`).
 */
export const AiSessionStore = signalStore(
  withState(initialState),
  withComputed(({ current, status, sending }) => ({
    messages: () => current()?.messages ?? [],
    profile: () => current()?.profile ?? null,
    isReady: () => status() === 'READY',
    isFailed: () => status() === 'FAILED',
    canSend: () => status() === 'READY' && !sending(),
  })),
  withMethods(
    (
      store,
      sessionRepo = inject(AI_SESSION_REPOSITORY),
      jobRepo = inject(AI_JOB_REPOSITORY),
      notification = inject(NotificationService),
    ) => {
      const fetchDetail = (id: string): Observable<void> =>
        sessionRepo.getSession(id).pipe(
          tap((detail) => patchState(store, { current: detail, detailLoading: false })),
          map(() => undefined),
        );

      /** Polling de la radiografía; al pasar a READY carga el detalle. */
      const pollStatus = rxMethod<string>(
        pipe(
          switchMap((id) =>
            timer(0, AI_SCRAPER_POLL_MS).pipe(
              take(AI_SCRAPER_POLL_MAX_ATTEMPTS),
              switchMap(() => sessionRepo.getStatus(id)),
              distinctUntilChanged((a, b) => a.status === b.status),
              tap((status) =>
                patchState(store, { status: status.status, statusError: status.error }),
              ),
              takeWhile((status) => !isAiSessionSettled(status.status), true),
              switchMap((status) => (status.status === 'READY' ? fetchDetail(id) : of(undefined))),
              catchError((err: Error) => {
                patchState(store, { statusError: err.message || 'Se perdió la conexión.' });
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      /** Polling del job creado por un mensaje; al terminar recarga el detalle. */
      const pollMessageJob = (sessionId: string, jobId: string): void => {
        timer(0, AI_SCRAPER_POLL_MS)
          .pipe(
            take(AI_SCRAPER_POLL_MAX_ATTEMPTS),
            switchMap(() => jobRepo.getJob(jobId)),
            distinctUntilChanged((a, b) => a.status === b.status),
            takeWhile((job) => isAiJobActive(job.status), true),
            switchMap(() => fetchDetail(sessionId)),
            catchError(() => EMPTY),
          )
          .subscribe();
      };

      const loadSessions = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            sessionRepo.listSessions().pipe(
              tap((sessions) => patchState(store, { sessions, loading: false })),
              catchError((err: Error) => {
                const message = err.message || 'No se pudieron cargar las sesiones.';
                patchState(store, { loading: false, error: message });
                notification.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      const createSession = rxMethod<AiCreateSessionInput>(
        pipe(
          tap(() =>
            patchState(store, { creating: true, error: null, current: null, status: null }),
          ),
          switchMap((input) =>
            sessionRepo.createSession(input).pipe(
              tap((session) => {
                patchState(store, { creating: false, status: session.status });
                notification.showInfo('Analizando la página… el chat se habilitará al terminar.');
                pollStatus(session.id);
              }),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo crear la sesión.';
                patchState(store, { creating: false, error: message });
                notification.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      const openSession = rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, {
              detailLoading: true,
              status: null,
              statusError: null,
              current: null,
            }),
          ),
          switchMap((id) =>
            fetchDetail(id).pipe(
              tap(() => {
                if (!isAiSessionSettled(store.status())) pollStatus(id);
              }),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo cargar la sesión.';
                patchState(store, { detailLoading: false, statusError: message });
                notification.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      const sendMessage = rxMethod<string>(
        pipe(
          switchMap((instruction) => {
            const session = store.current();
            if (!session) return EMPTY;
            patchState(store, { sending: true });
            return sessionRepo.sendMessage(session.id, instruction).pipe(
              tap(({ jobId }) => {
                patchState(store, { sending: false });
                fetchDetail(session.id).subscribe();
                pollMessageJob(session.id, jobId);
              }),
              catchError((err: Error) => {
                patchState(store, { sending: false });
                notification.showError(err.message || 'No se pudo enviar el mensaje.');
                return EMPTY;
              }),
            );
          }),
        ),
      );

      return {
        loadSessions,
        createSession,
        openSession,
        sendMessage,

        /** Limpia la sesión activa (al salir del chat). */
        clearCurrent(): void {
          patchState(store, { current: null, status: null, statusError: null });
        },
      };
    },
  ),
);
