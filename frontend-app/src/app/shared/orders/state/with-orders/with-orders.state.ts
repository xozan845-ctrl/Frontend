import { InjectionToken, inject, untracked } from '@angular/core';
import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import type { OrdersFeatureOptions, OrdersState } from '../../models/orders-state.model';
import type { OrdersDataSource } from '../../repositories/orders-data-source/orders-data-source.repository';

const LOAD_ERROR = 'No se pudieron cargar los pedidos.';
const DETAIL_ERROR = 'No se pudo cargar el pedido.';
const UPDATE_ERROR = 'No se pudo actualizar el estado del pedido.';

/**
 * Store de pedidos compartido por empresa y vendedor (ADR-62).
 *
 * Aporta la lista, el detalle, la recarga silenciosa y el cambio de estado con
 * la misma semántica de carga y avisos. El workspace decide el tipo de vista y
 * qué capacidades expone mediante `OrdersDataSource`; los derivados de cada
 * pantalla (filtros, KPIs, filas) quedan en su propio store.
 */
export function withOrders<T extends { id: string | number }, S extends string = string>(
  sourceToken: InjectionToken<OrdersDataSource<T, S>>,
  options: OrdersFeatureOptions = {},
) {
  const loadError = options.loadErrorMessage ?? LOAD_ERROR;
  const detailError = options.detailErrorMessage ?? DETAIL_ERROR;
  const updateError = options.updateErrorMessage ?? UPDATE_ERROR;

  return signalStoreFeature(
    withState<OrdersState<T>>({
      orderRecords: [],
      loading: false,
      error: null,
      lastUpdatedAt: null,
      selectedRecord: null,
      selectedLoading: false,
      selectedError: null,
      updatingStatus: false,
    }),
    withMethods(
      (store, source = inject(sourceToken), notificationService = inject(NotificationService)) => {
        /** Carga visible: progreso, error y marca de actualización. */
        const loadOrders = rxMethod<void>(
          pipe(
            tap(() => patchState(store, { loading: true, error: null })),
            switchMap(() =>
              source.list().pipe(
                tap((orders) =>
                  patchState(store, {
                    orderRecords: orders,
                    loading: false,
                    error: null,
                    lastUpdatedAt: Date.now(),
                  }),
                ),
                catchError((error: Error) => {
                  const message = error.message || loadError;
                  patchState(store, { loading: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        );

        /** Recarga silenciosa: conserva la lista anterior si falla. */
        const refresh = rxMethod<void>(
          pipe(
            switchMap(() =>
              source.list().pipe(
                tap((orders) =>
                  patchState(store, {
                    orderRecords: orders,
                    error: null,
                    lastUpdatedAt: Date.now(),
                  }),
                ),
                catchError((error: Error) => {
                  patchState(store, { error: error.message || loadError });
                  return EMPTY;
                }),
              ),
            ),
          ),
        );

        /** Carga el pedido abierto y refleja los cambios en la lista. */
        const loadOrder = rxMethod<string>(
          pipe(
            tap(() => patchState(store, { selectedLoading: true, selectedError: null })),
            switchMap((id) => {
              if (!source.detail) {
                patchState(store, { selectedLoading: false });
                return EMPTY;
              }
              return source.detail(id).pipe(
                tap((order) => {
                  patchState(store, {
                    selectedRecord: order,
                    selectedLoading: false,
                    // Lectura sin rastreo: el pipe puede correr dentro de un
                    // contexto reactivo (señal del parámetro de ruta).
                    orderRecords: untracked(() => store.orderRecords()).map((item) =>
                      item.id === order.id ? order : item,
                    ),
                  });
                }),
                catchError((error: Error) => {
                  const message = error.message || detailError;
                  patchState(store, { selectedLoading: false, selectedError: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              );
            }),
          ),
        );

        /**
         * Cambia el estado del pedido abierto y refleja el resultado en detalle
         * y lista. Sin pedido seleccionado o sin capacidad no llama al backend.
         */
        const updateStatus = rxMethod<S>(
          pipe(
            tap(() => patchState(store, { updatingStatus: true, selectedError: null })),
            switchMap((status) => {
              const id = untracked(() => store.selectedRecord())?.id;
              if (id === undefined || id === null || !source.updateStatus) {
                patchState(store, { updatingStatus: false });
                return EMPTY;
              }
              return source.updateStatus(String(id), status).pipe(
                tap((order) => {
                  patchState(store, {
                    selectedRecord: order,
                    updatingStatus: false,
                    orderRecords: untracked(() => store.orderRecords()).map((item) =>
                      item.id === order.id ? order : item,
                    ),
                    lastUpdatedAt: Date.now(),
                  });
                  notificationService.showSuccess(
                    options.updateSuccessMessage?.(String(order.id)) ??
                      `Pedido ${order.id} actualizado.`,
                  );
                }),
                catchError((error: Error) => {
                  const message = error.message || updateError;
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

          /** Limpia el detalle al salir de la página (`R-AR-10`). */
          clearSelectedOrder(): void {
            patchState(store, {
              selectedRecord: null,
              selectedLoading: false,
              selectedError: null,
              updatingStatus: false,
            });
          },
        };
      },
    ),
  );
}
