import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { FieldIncident } from '../../models/incidencia.model';
import { INCIDENCIA_REPOSITORY } from '../../repositories/incidencia.repository';
import type { IncidenciasState } from './incidencias.state';

const initialState: IncidenciasState = {
  incidents: [],
  loading: false,
  error: null,
  selectedIncidentId: null,
  statusFilter: null,
  savingId: null,
};

/**
 * Incidencias de logística de campo (ADR-41): lista, filtro por estado,
 * selección y actualización de estado/resolución.
 */
export const IncidenciasStore = signalStore(
  withState(initialState),
  withComputed(({ incidents, selectedIncidentId, statusFilter }) => ({
    filteredIncidents: computed(() => {
      const status = statusFilter();
      return status ? incidents().filter((incident) => incident.status === status) : incidents();
    }),
    selectedIncident: computed(() => {
      const id = selectedIncidentId();
      return id ? (incidents().find((incident) => incident.id === id) ?? null) : null;
    }),
    totalIncidents: computed(() => incidents().length),
    openCount: computed(
      () => incidents().filter((incident) => incident.status === 'abierta').length,
    ),
    inProgressCount: computed(
      () => incidents().filter((incident) => incident.status === 'en_progreso').length,
    ),
    resolvedCount: computed(
      () => incidents().filter((incident) => incident.status === 'resuelta').length,
    ),
  })),
  withMethods(
    (
      store,
      incidenciaRepo = inject(INCIDENCIA_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => ({
      /** Carga las incidencias y selecciona la primera si no hay una válida. */
      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            incidenciaRepo.list().pipe(
              tap((incidents) => {
                const current = store.selectedIncidentId();
                const selected = incidents.some((incident) => incident.id === current)
                  ? current
                  : (incidents[0]?.id ?? null);
                patchState(store, {
                  incidents,
                  selectedIncidentId: selected,
                  loading: false,
                  error: null,
                });
              }),
              catchError((err: Error) => {
                const message = err.message || 'No se pudieron cargar las incidencias.';
                patchState(store, { loading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      selectIncident(incidentId: string | null): void {
        patchState(store, { selectedIncidentId: incidentId });
      },

      setStatusFilter(status: string | null): void {
        patchState(store, { statusFilter: status });
      },

      /** Actualiza el estado y la resolución de una incidencia. */
      updateIncident: rxMethod<{ id: string; status: string; resolution?: string }>(
        pipe(
          tap(({ id }) => patchState(store, { savingId: id, error: null })),
          switchMap(({ id, status, resolution }) =>
            incidenciaRepo.update(id, { status, resolution }).pipe(
              tap((updated: FieldIncident) => {
                patchState(store, {
                  savingId: null,
                  error: null,
                  incidents: store
                    .incidents()
                    .map((incident) => (incident.id === updated.id ? updated : incident)),
                });
                notificationService.showSuccess('Incidencia actualizada.');
              }),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo actualizar la incidencia.';
                patchState(store, { savingId: null, error: message });
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
    }),
  ),
);
