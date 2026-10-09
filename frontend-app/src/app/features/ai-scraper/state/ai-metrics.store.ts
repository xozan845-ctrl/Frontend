import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, forkJoin, of, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { AiHealth, AiMetrics } from '../models/ai-metrics.model';
import { AI_METRICS_REPOSITORY } from '../repositories/ai-metrics.repository';

export interface AiMetricsState {
  metrics: AiMetrics | null;
  health: AiHealth | null;
  loading: boolean;
  error: string | null;
}

const initialState: AiMetricsState = {
  metrics: null,
  health: null,
  loading: false,
  error: null,
};

/** Estado de observabilidad del backend de IA (`R-AR-5`). */
export const AiMetricsStore = signalStore(
  withState(initialState),
  withMethods((store, metricsRepo = inject(AI_METRICS_REPOSITORY)) => {
    /** Carga métricas + salud en paralelo (la salud es best-effort). */
    const load = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          forkJoin({
            metrics: metricsRepo.getMetrics(),
            health: metricsRepo.getHealth().pipe(catchError(() => of(null))),
          }).pipe(
            tap(({ metrics, health }) => patchState(store, { metrics, health, loading: false })),
            catchError((err: Error) => {
              patchState(store, {
                loading: false,
                error: err.message || 'No se pudieron cargar las métricas.',
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    return { load };
  }),
);
