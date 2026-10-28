import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { ORDER_REPOSITORY } from '../../../cart/public-api';
import type { AccountOrdersState } from '../account.state';

const initialState: AccountOrdersState = {
  orders: [],
  loading: true,
  error: null,
};

/**
 * Historial de pedidos del comprador (`R-ST-1`): el store orquesta el puerto
 * de órdenes y la página sólo consume su estado. Se provee por ruta para no
 * conservar el historial entre navegaciones (`R-ST-6`).
 */
export const AccountOrdersStore = signalStore(
  withState(initialState),
  withMethods((store, orderRepo = inject(ORDER_REPOSITORY)) => ({
    loadOrders: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          orderRepo.getOrders().pipe(
            tap((orders) => patchState(store, { orders, loading: false })),
            catchError((err: Error) => {
              patchState(store, {
                error: err.message || 'No se pudieron cargar tus pedidos.',
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
