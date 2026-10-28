import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, forkJoin, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { ADMIN_ORDER_REPOSITORY } from '../../repositories/admin-order.repository';
import type { AdminOrdersState } from './admin-orders.state';

const initialState: AdminOrdersState = {
  orders: [],
  loading: false,
  error: null,
  statusFilter: null,
  selectedOrder: null,
  timeline: [],
  selectedLoading: false,
  selectedError: null,
  updating: false,
};

/**
 * Órdenes para administración (ADR-36): lista global con filtro y detalle con
 * timeline. La transición de estado usa `PATCH /orders/:id/estado`.
 */
export const AdminOrdersStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      orderRepo = inject(ADMIN_ORDER_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => {
      const load = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            orderRepo.listAll(store.statusFilter() ?? undefined, 100).pipe(
              tap((orders) => patchState(store, { orders, loading: false, error: null })),
              catchError((err: Error) => {
                const message = err.message || 'No se pudieron cargar las órdenes.';
                patchState(store, { loading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      );

      return {
        /** Carga las órdenes con el filtro actual. */
        load,

        /** Aplica el filtro por estado y recarga. */
        setStatusFilter(status: string | null): void {
          patchState(store, { statusFilter: status });
          load();
        },

        /** Carga detalle + timeline de una orden. */
        selectOrder: rxMethod<string>(
          pipe(
            tap((id) =>
              patchState(store, {
                selectedLoading: true,
                selectedError: null,
                selectedOrder: null,
                timeline: [],
                orders: store
                  .orders()
                  .map((order) => (String(order.id) === id ? { ...order } : order)),
              }),
            ),
            switchMap((id) =>
              forkJoin({
                order: orderRepo.getOrder(id),
                timeline: orderRepo.getTimeline(id),
              }).pipe(
                tap(({ order, timeline }) =>
                  patchState(store, {
                    selectedOrder: order,
                    timeline,
                    selectedLoading: false,
                    selectedError: null,
                  }),
                ),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo cargar la orden.';
                  patchState(store, { selectedLoading: false, selectedError: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        /** Cierra el detalle seleccionado. */
        closeOrder(): void {
          patchState(store, {
            selectedOrder: null,
            timeline: [],
            selectedError: null,
            selectedLoading: false,
          });
        },

        /** Avanza el estado de la orden seleccionada. */
        advanceStatus: rxMethod<{ status: string; reason?: string }>(
          pipe(
            tap(() => patchState(store, { updating: true, selectedError: null })),
            switchMap(({ status, reason }) => {
              const order = store.selectedOrder();
              if (!order) {
                patchState(store, { updating: false, selectedError: 'Selecciona una orden.' });
                return EMPTY;
              }

              return orderRepo.advanceStatus(String(order.id), status, reason).pipe(
                tap((update) => {
                  patchState(store, {
                    updating: false,
                    selectedOrder: { ...order, status: update.status },
                    orders: store
                      .orders()
                      .map((item) =>
                        String(item.id) === String(order.id)
                          ? { ...item, status: update.status }
                          : item,
                      ),
                  });
                  notificationService.showSuccess('Estado de la orden actualizado.');
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo actualizar el estado.';
                  patchState(store, { updating: false, selectedError: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              );
            }),
          ),
        ),

        clearError(): void {
          patchState(store, { error: null });
        },

        reset(): void {
          patchState(store, initialState);
        },
      };
    },
  ),
);
