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
import { fromEvent, pipe, timer } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import { withOrders } from '../../../../../shared/orders/state/with-orders/with-orders.state';
import { VENDOR_POLL_INTERVAL_MS } from '../../constants/vendor.constants';
import { OrderStatus, VendorOrder } from '../../models/vendor-order.model';
import { VENDOR_ORDERS_SOURCE } from '../../repositories/vendor-order.repository';
import type { VendorOrdersUiState, VendorTodayKpis } from '../vendor.state';

const initialState: VendorOrdersUiState = {
  live: false,
  statusFilter: null,
};

/** ¿La pestaña está oculta? Con la pestaña oculta el sondeo no consulta (`R-PF-3`). */
function isDocumentHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

/**
 * Pedidos del vendedor: tabla del POS y de la lista completa, filtro por
 * estado, detalle con cambio de estado (`R-ST-1`, `R-RB-3`). La lista, el
 * detalle y los avisos vienen del store compartido `withOrders` (ADR-62); este
 * store añade el filtro por estado, los KPIs, el modo "en vivo" y los
 * derivados de la pantalla (`R-ST-3`).
 *
 * Store de feature (no `root`) con recarga por puerto y `rxMethod`
 * (`R-ST-5`); el sondeo usa `timer` —sin `setInterval` (`R-PF-6`)—, se pausa
 * con la pestaña oculta y se libera con el store (`R-AR-10`).
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
  withOrders<VendorOrder, OrderStatus>(VENDOR_ORDERS_SOURCE),
  withState(initialState),
  withComputed((store) => ({
    /** Pedidos normalizados que consumen las pantallas del vendedor. */
    orders: computed(() => store.orderRecords()),
    /** Pedido abierto en la página de detalle (`pedidos/:id`). */
    selectedOrder: computed(() => store.selectedRecord()),
    /** Últimos pedidos para el inicio y el POS (`R-ST-3`). */
    recentOrders: computed(() => store.orderRecords().slice(0, 5)),
    /** Lista filtrada por estado para la página "Pedidos" (`R-SO-8`). */
    filteredOrders: computed(() => {
      const status = store.statusFilter();
      return status
        ? store.orderRecords().filter((order) => order.status === status)
        : store.orderRecords();
    }),
    /** Conteo por estado para los chips del filtro. */
    statusCounts: computed(() => {
      const counts: Record<OrderStatus, number> = {
        pendiente: 0,
        en_proceso: 0,
        completado: 0,
        cancelado: 0,
      };
      for (const order of store.orderRecords()) {
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
      for (const order of store.orderRecords()) {
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
  withMethods((store) => {
    /** Reloj del modo "en vivo"; cada pulso delega en la recarga silenciosa. */
    const poll = rxMethod<void>(
      pipe(
        switchMap(() =>
          timer(VENDOR_POLL_INTERVAL_MS, VENDOR_POLL_INTERVAL_MS).pipe(
            filter(() => store.live() && !isDocumentHidden()),
            tap(() => store.refresh()),
          ),
        ),
      ),
    );

    return {
      /** Aplica el filtro por estado de la lista (`null` = "Todas"). */
      setStatusFilter(status: OrderStatus | null): void {
        patchState(store, { statusFilter: status });
      },

      /** Arranca el modo "en vivo": primera carga visible y refresco por intervalo. */
      startPolling(): void {
        if (store.live()) return;
        patchState(store, { live: true });
        store.loadOrders();
        poll();
      },

      /** Detiene el modo "en vivo" (al salir de la pantalla). */
      stopPolling(): void {
        patchState(store, { live: false });
      },
    };
  }),
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
