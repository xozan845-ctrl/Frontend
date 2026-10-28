import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../auth/public-api';
import { ShipmentProvider } from '../../models/envio.model';
import { ENVIO_REPOSITORY } from '../../repositories/envio.repository';
import type { EnviosState } from './envios.state';

const initialState: EnviosState = {
  shipments: [],
  loading: false,
  error: null,
  statusFilter: '',
  assigningId: null,
  advancingId: null,
};

/**
 * Envíos de logística (ADR-37): admin ve todas las guías; el empresario ve las
 * de su empresa. Incluye asignación de flota y avance de estado.
 */
export const EnviosStore = signalStore(
  withState(initialState),
  withComputed(({ shipments, statusFilter }) => ({
    /** Lista filtrada por estado; el derivado vive en el store (`R-ST-3`). */
    filteredShipments: computed(() => {
      const status = statusFilter();
      return status ? shipments().filter((shipment) => shipment.status === status) : shipments();
    }),
  })),
  withMethods(
    (
      store,
      envioRepo = inject(ENVIO_REPOSITORY),
      authStore = inject(AuthStore),
      notificationService = inject(NotificationService),
    ) => {
      const isAdmin = (): boolean => {
        const role = authStore.user()?.role;
        return role === 'admin' || role === 'super_admin';
      };

      const load = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() => {
            const role = authStore.user()?.role;
            if (role !== 'admin' && role !== 'super_admin' && role !== 'empresario') {
              patchState(store, {
                loading: false,
                error: 'Tu rol no puede consultar envíos.',
              });
              return EMPTY;
            }
            return (isAdmin() ? envioRepo.listAdmin() : envioRepo.listCompany()).pipe(
              tap((shipments) => patchState(store, { shipments, loading: false, error: null })),
              catchError((err: Error) => {
                const message = err.message || 'No se pudieron cargar los envíos.';
                patchState(store, { loading: false, error: message });
                notificationService.showError(message);
                return EMPTY;
              }),
            );
          }),
        ),
      );

      return {
        /** Carga los envíos según el rol de la sesión. */
        load,

        /** Asigna la flota de un envío híbrido. */
        assignProvider: rxMethod<{ id: string; provider: ShipmentProvider }>(
          pipe(
            tap(({ id }) => patchState(store, { assigningId: id, error: null })),
            switchMap(({ id, provider }) =>
              envioRepo.assignProvider(id, provider).pipe(
                tap((updated) => {
                  patchState(store, {
                    assigningId: null,
                    error: null,
                    shipments: store
                      .shipments()
                      .map((shipment) =>
                        shipment.id === updated.id ? { ...shipment, ...updated } : shipment,
                      ),
                  });
                  notificationService.showSuccess('Flota asignada al envío.');
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo asignar la flota.';
                  patchState(store, { assigningId: null, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        /** Avanza el estado de un envío. */
        advanceStatus: rxMethod<{ id: string; status: string; reason?: string }>(
          pipe(
            tap(({ id }) => patchState(store, { advancingId: id, error: null })),
            switchMap(({ id, status, reason }) =>
              envioRepo.advanceStatus(id, status, reason).pipe(
                tap((updated) => {
                  patchState(store, {
                    advancingId: null,
                    error: null,
                    shipments: store
                      .shipments()
                      .map((shipment) =>
                        shipment.id === updated.id ? { ...shipment, ...updated } : shipment,
                      ),
                  });
                  notificationService.showSuccess('Estado del envío actualizado.');
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo actualizar el estado del envío.';
                  patchState(store, { advancingId: null, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        /** Aplica el filtro por estado de la lista (`''` = todas). */
        setStatusFilter(statusFilter: string): void {
          patchState(store, { statusFilter });
        },

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
