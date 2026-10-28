import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, forkJoin, of, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { ORDER_REPOSITORY } from '../../../cart/public-api';
import type { AccountOrderDetailState } from '../account.state';

const initialState: AccountOrderDetailState = {
  order: null,
  timeline: [],
  loading: true,
  error: null,
};

/**
 * Detalle de un pedido (`R-ST-1`): el store resuelve orden + timeline y la
 * página sólo pinta el estado. Se provee por ruta (`R-ST-6`).
 */
export const OrderDetailStore = signalStore(
  withState(initialState),
  withMethods((store, orderRepo = inject(ORDER_REPOSITORY)) => ({
    loadOrder: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { order: null, timeline: [], loading: true, error: null })),
        switchMap((id) =>
          forkJoin({
            order: orderRepo.getOrder(id),
            timeline: orderRepo.getTimeline(id).pipe(catchError(() => of([]))),
          }).pipe(
            tap(({ order, timeline }) => patchState(store, { order, timeline, loading: false })),
            catchError((err: Error) => {
              patchState(store, {
                error: err.message || 'No se pudo cargar el pedido.',
                loading: false,
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
  })),
);
