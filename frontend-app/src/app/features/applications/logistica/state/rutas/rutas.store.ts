import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { Parada, Ruta } from '../../models/ruta.model';
import { RUTA_REPOSITORY } from '../../repositories/ruta.repository';
import type { RutasState } from './rutas.state';

const initialState: RutasState = {
  routes: [],
  loading: false,
  error: null,
  selectedRouteId: null,
  statusFilter: '',
  savingRouteId: null,
  savingStopId: null,
};

/**
 * Rutas de logística de campo (ADR-39): lista las rutas del tenant con sus
 * paradas, permite cambiar el estado de la ruta y completar/reabrir paradas.
 */
export const RutasStore = signalStore(
  withState(initialState),
  withComputed(({ routes, selectedRouteId, statusFilter }) => ({
    selectedRoute: computed(() => {
      const id = selectedRouteId();
      return id ? (routes().find((route) => route.id === id) ?? null) : null;
    }),
    /** Lista filtrada por estado; el derivado vive en el store (`R-ST-3`). */
    filteredRoutes: computed(() => {
      const status = statusFilter();
      return status ? routes().filter((route) => route.status === status) : routes();
    }),
    routeCount: computed(() => routes().length),
    totalStops: computed(() => routes().reduce((sum, route) => sum + route.stops.length, 0)),
    completedStops: computed(() =>
      routes().reduce((sum, route) => sum + route.stops.filter((stop) => stop.completed).length, 0),
    ),
  })),
  withMethods(
    (
      store,
      rutaRepo = inject(RUTA_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => {
      const replaceRoute = (updated: Ruta): void => {
        patchState(store, {
          routes: store.routes().map((route) =>
            route.id === updated.id
              ? {
                  ...route,
                  ...updated,
                  // `PATCH /field/rutas/:id` no devuelve paradas: se conservan.
                  stops: updated.stops.length > 0 ? updated.stops : route.stops,
                }
              : route,
          ),
        });
      };

      const replaceStop = (routeId: string, updated: Parada): void => {
        patchState(store, {
          routes: store.routes().map((route) =>
            route.id === routeId
              ? {
                  ...route,
                  stops: route.stops.map((stop) => (stop.id === updated.id ? updated : stop)),
                }
              : route,
          ),
        });
      };

      return {
        /** Carga las rutas y selecciona la primera si no hay una válida. */
        load: rxMethod<void>(
          pipe(
            tap(() => patchState(store, { loading: true, error: null })),
            switchMap(() =>
              rutaRepo.list().pipe(
                tap((routes) => {
                  const current = store.selectedRouteId();
                  const selected = routes.some((route) => route.id === current)
                    ? current
                    : (routes[0]?.id ?? null);
                  patchState(store, {
                    routes,
                    selectedRouteId: selected,
                    loading: false,
                    error: null,
                  });
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudieron cargar las rutas.';
                  patchState(store, { loading: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        selectRoute(routeId: string | null): void {
          patchState(store, { selectedRouteId: routeId });
        },

        /** Aplica el filtro por estado de la lista (`''` = todas). */
        setStatusFilter(statusFilter: string): void {
          patchState(store, { statusFilter });
        },

        /** Cambia el estado de una ruta. */
        updateStatus: rxMethod<{ routeId: string; status: string }>(
          pipe(
            tap(({ routeId }) => patchState(store, { savingRouteId: routeId, error: null })),
            switchMap(({ routeId, status }) =>
              rutaRepo.updateStatus(routeId, status).pipe(
                tap((updated) => {
                  replaceRoute(updated);
                  patchState(store, { savingRouteId: null, error: null });
                  notificationService.showSuccess('Estado de la ruta actualizado.');
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo actualizar la ruta.';
                  patchState(store, { savingRouteId: null, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        /** Completa o reabre una parada enviando `nombre` (contrato del backend). */
        toggleStop: rxMethod<{ routeId: string; stop: Parada }>(
          pipe(
            tap(({ stop }) => patchState(store, { savingStopId: stop.id, error: null })),
            switchMap(({ routeId, stop }) =>
              rutaRepo
                .updateStop(routeId, stop.id, {
                  name: stop.name,
                  completed: !stop.completed,
                })
                .pipe(
                  tap((updated) => {
                    replaceStop(routeId, updated);
                    patchState(store, { savingStopId: null, error: null });
                    notificationService.showSuccess(
                      updated.completed ? 'Parada completada.' : 'Parada reabierta.',
                    );
                  }),
                  catchError((err: Error) => {
                    const message = err.message || 'No se pudo actualizar la parada.';
                    patchState(store, { savingStopId: null, error: message });
                    notificationService.showError(message);
                    return EMPTY;
                  }),
                ),
            ),
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
