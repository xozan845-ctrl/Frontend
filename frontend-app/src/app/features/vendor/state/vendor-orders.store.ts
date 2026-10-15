import { DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, fromEvent, pipe, timer } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../core/services/notification.service';
import { VENDOR_POLL_INTERVAL_MS } from '../constants/vendor.constants';
import { OrderStatus, VendorOrder } from '../models/vendor-order.model';
import { VENDOR_ORDER_REPOSITORY } from '../repositories/vendor-order.repository';

export interface VendorOrdersState {
  orders: VendorOrder[];
  loading: boolean;
  error: string | null;
  /** Marca de tiempo (ms) de la última carga lograda; alimenta "Actualizado …". */
  lastUpdatedAt: number | null;
  /** Modo "en vivo": sondeo activo que se pausa con la pestaña oculta. */
  live: boolean;
  /** Filtro por estado de la lista completa; `null` equivale a "Todas". */
  statusFilter: OrderStatus | null;
}

const initialState: VendorOrdersState = {
  orders: [],
  loading: false,
  error: null,
  lastUpdatedAt: null,
  live: false,
  statusFilter: null,
};

/** ¿La pestaña está oculta? Con la pestaña oculta el sondeo no consulta (`R-PF-3`). */
function isDocumentHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

/**
 * Pedidos del vendedor: "Pedidos recientes" del POS y la lista completa con
 * filtro por estado (`R-ST-1`). Store de feature (no `root`) con recarga por
 * puerto y `rxMethod` (`R-ST-5`); el modo "en vivo" sondea cada
 * `VENDOR_POLL_INTERVAL_MS` con `timer` —sin `setInterval` (`R-PF-6`)—, se
 * pausa con la pestaña oculta y se libera con el store (`R-AR-10`). Los
 * derivados de la lista (filtro y conteos) viven en `withComputed` (`R-ST-3`).
 */
export const VendorOrdersStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    /** Lista filtrada por estado para la página "Pedidos" (`R-SO-8`). */
    filteredOrders: computed(() => {
      const status = store.statusFilter();
      return status ? store.orders().filter((order) => order.status === status) : store.orders();
    }),
    /** Conteo por estado para los chips del filtro. */
    statusCounts: computed(() => {
      const counts: Record<OrderStatus, number> = {
        pendiente: 0,
        en_proceso: 0,
        completado: 0,
        cancelado: 0,
      };
      for (const order of store.orders()) {
        counts[order.status] += 1;
      }
      return counts;
    }),
  })),
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

      /** Reloj del modo "en vivo"; cada pulso delega en la recarga silenciosa. */
      const poll = rxMethod<void>(
        pipe(
          switchMap(() =>
            timer(VENDOR_POLL_INTERVAL_MS, VENDOR_POLL_INTERVAL_MS).pipe(
              filter(() => store.live() && !isDocumentHidden()),
              tap(() => refresh()),
            ),
          ),
        ),
      );

      return {
        loadOrders,
        refresh,

        /** Aplica el filtro por estado de la lista (`null` = "Todas"). */
        setStatusFilter(status: OrderStatus | null): void {
          patchState(store, { statusFilter: status });
        },

        /** Arranca el modo "en vivo": primera carga visible y refresco por intervalo. */
        startPolling(): void {
          if (store.live()) return;
          patchState(store, { live: true });
          loadOrders();
          poll();
        },

        /** Detiene el modo "en vivo" (al salir de la pantalla). */
        stopPolling(): void {
          patchState(store, { live: false });
        },
      };
    },
  ),
  withHooks({
    onInit(store) {
      const destroyRef = inject(DestroyRef);
      // Al volver a la pestaña, refresca de inmediato si el modo sigue activo.
      fromEvent(document, 'visibilitychange')
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe(() => {
          if (!isDocumentHidden() && store.live()) {
            store.refresh();
          }
        });
    },
  }),
);
