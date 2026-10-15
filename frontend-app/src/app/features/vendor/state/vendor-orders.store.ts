import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../core/services/notification.service';
import { VendorOrder } from '../models/vendor-order.model';
import { VENDOR_ORDER_REPOSITORY } from '../repositories/vendor-order.repository';

export interface VendorOrdersState {
  orders: VendorOrder[];
  loading: boolean;
  error: string | null;
  /** Marca de tiempo (ms) de la última carga lograda; alimenta "actualizado hace X". */
  lastUpdatedAt: number | null;
}

const initialState: VendorOrdersState = {
  orders: [],
  loading: false,
  error: null,
  lastUpdatedAt: null,
};

/**
 * Pedidos del vendedor: "Pedidos recientes" del POS y, más adelante, la lista
 * completa (`R-ST-1`). Store de feature (no `root`) con recarga por puerto y
 * `rxMethod` (`R-ST-5`); el polling en vivo se agrega sobre `refresh`.
 */
export const VendorOrdersStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      orderRepo = inject(VENDOR_ORDER_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => {
      /** Carga visible: muestra progreso y avisa si falla. */
      const loadOrders = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            orderRepo.listOrders().pipe(
              tap((orders) =>
                patchState(store, { orders, loading: false, lastUpdatedAt: Date.now() }),
              ),
              catchError((err: Error) => {
                const message = err.message || 'No se pudieron cargar los pedidos.';
                patchState(store, { loading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      /**
       * Recarga silenciosa (polling en vivo, tras registrar un pedido): sin
       * spinner ni avisos de error, conserva la lista anterior si falla.
       */
      const refresh = rxMethod<void>(
        pipe(
          switchMap(() =>
            orderRepo.listOrders().pipe(
              tap((orders) =>
                patchState(store, { orders, error: null, lastUpdatedAt: Date.now() }),
              ),
              catchError((err: Error) => {
                patchState(store, {
                  error: err.message || 'No se pudieron cargar los pedidos.',
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      return { loadOrders, refresh };
    },
  ),
);
