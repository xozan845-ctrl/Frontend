import { DestroyRef, computed, inject, untracked } from '@angular/core';
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
import { NotificationService } from '../../../../core/services/notification.service';
import { VENDOR_POLL_INTERVAL_MS } from '../../constants/vendor.constants';
import { OrderStatus } from '../../models/vendor-order.model';
import { VENDOR_ORDER_REPOSITORY } from '../../repositories/vendor-order.repository';
import type { VendorOrdersState, VendorTodayKpis } from '../vendor.state';

const initialState: VendorOrdersState = {
  orders: [],
  loading: false,
  error: null,
  lastUpdatedAt: null,
  live: false,
  statusFilter: null,
  selectedOrder: null,
  selectedLoading: false,
  selectedError: null,
  updatingStatus: false,
};

/** ¿La pestaña está oculta? Con la pestaña oculta el sondeo no consulta (`R-PF-3`). */
function isDocumentHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

/**
 * Pedidos del vendedor: tabla del POS y de la lista completa, filtro por
 * estado, detalle con cambio de estado (`R-ST-1`, `R-RB-3`). Store de feature
 * (no `root`) con recarga por puerto y `rxMethod` (`R-ST-5`); el modo "en
 * vivo" sondea cada `VENDOR_POLL_INTERVAL_MS` con `timer` —sin `setInterval`
 * (`R-PF-6`)—, se pausa con la pestaña oculta y se libera con el store
 * (`R-AR-10`). Los derivados de la lista (filtro y conteos) viven en
 * `withComputed` (`R-ST-3`).
 */

/** ¿La marca ISO cae en el día local de `today`? (vacía o inválida → false). */
function isSameLocalDay(iso: string, today: Date): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}
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
    /** KPIs del inicio: vendido hoy (sin cancelados) y trabajo por atender. */
    todayKpis: computed<VendorTodayKpis>(() => {
      const today = new Date();
      let soldToday = 0;
      let ordersToday = 0;
      let pending = 0;
      let inProgress = 0;
      for (const order of store.orders()) {
        if (order.status === 'pendiente') pending += 1;
        if (order.status === 'en_proceso') inProgress += 1;
        if (isSameLocalDay(order.createdAt, today)) {
          ordersToday += 1;
          if (order.status !== 'cancelado') soldToday += order.total;
        }
      }
      return { soldToday, ordersToday, pending, inProgress };
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

      /** Carga el pedido del detalle y lo refleja en la lista si ya estaba. */
      const loadOrder = rxMethod<string>(
        pipe(
          tap(() => patchState(store, { selectedLoading: true, selectedError: null })),
          switchMap((id) =>
            orderRepo.getOrder(id).pipe(
              tap((order) =>
                patchState(store, {
                  selectedOrder: order,
                  selectedLoading: false,
                  // Lectura sin rastreo: el pipe puede correr dentro de un
                  // contexto reactivo (señal del parámetro de ruta).
                  orders: untracked(() => store.orders()).map((item) =>
                    item.id === order.id ? order : item,
                  ),
                }),
              ),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo cargar el pedido.';
                patchState(store, { selectedLoading: false, selectedError: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      /**
       * Cambia el estado del pedido abierto (`R-RB-3`): exige un pedido
       * seleccionado, refleja el resultado en detalle y lista, y avisa.
       */
      const updateStatus = rxMethod<OrderStatus>(
        pipe(
          tap(() => patchState(store, { updatingStatus: true, selectedError: null })),
          switchMap((status) => {
            const id = untracked(() => store.selectedOrder())?.id;
            if (!id) {
              patchState(store, { updatingStatus: false });
              return EMPTY;
            }
            return orderRepo.updateStatus(id, status).pipe(
              tap((order) => {
                patchState(store, {
                  selectedOrder: order,
                  updatingStatus: false,
                  orders: untracked(() => store.orders()).map((item) =>
                    item.id === order.id ? order : item,
                  ),
                  lastUpdatedAt: Date.now(),
                });
                notificationService.showSuccess(`Pedido ${order.id} actualizado.`);
              }),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo actualizar el estado del pedido.';
                patchState(store, { updatingStatus: false, selectedError: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            );
          }),
        ),
      );

      return {
        loadOrders,
        refresh,
        loadOrder,
        updateStatus,

        /** Aplica el filtro por estado de la lista (`null` = "Todas"). */
        setStatusFilter(status: OrderStatus | null): void {
          patchState(store, { statusFilter: status });
        },

        /** Limpia el detalle al salir de la página (`R-AR-10`). */
        clearSelectedOrder(): void {
          patchState(store, {
            selectedOrder: null,
            selectedLoading: false,
            selectedError: null,
            updatingStatus: false,
          });
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
