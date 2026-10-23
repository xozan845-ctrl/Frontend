import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { StorageTenantStatus, bytesToGigabytes } from '../../models/storage.model';
import { STORAGE_REPOSITORY } from '../../repositories/storage.repository';
import type { StorageState } from './storage.state';

const initialState: StorageState = {
  tenants: [],
  loading: false,
  error: null,
  savingId: null,
  recalculatingId: null,
  total: 0,
  page: 1,
  pages: 0,
  quotaDrafts: {},
};

/**
 * Administración de almacenamiento (ADR-38): lista los buckets de los tenants y
 * permite ajustar cuota, suspender/reactivar y recalcular el uso.
 */
export const StorageStore = signalStore(
  withState(initialState),
  withComputed(({ tenants, total, quotaDrafts }) => ({
    hasTenants: computed(() => tenants().length > 0),
    totalUsedBytes: computed(() => tenants().reduce((sum, tenant) => sum + tenant.usedBytes, 0)),
    totalQuotaBytes: computed(() => tenants().reduce((sum, tenant) => sum + tenant.quotaBytes, 0)),
    activeCount: computed(() => tenants().filter((tenant) => tenant.status === 'activo').length),
    totalTenants: computed(() => total()),
    /** Cuota editable (GB) por tenant: borrador o valor del servidor. */
    quotaValues: computed<Record<string, string>>(() => {
      const drafts = quotaDrafts();
      return Object.fromEntries(
        tenants().map((tenant) => [
          tenant.tenantId,
          drafts[tenant.tenantId] ?? String(bytesToGigabytes(tenant.quotaBytes)),
        ]),
      );
    }),
    quotaValid: computed<Record<string, boolean>>(() => {
      const drafts = quotaDrafts();
      return Object.fromEntries(
        tenants().map((tenant) => {
          const value = drafts[tenant.tenantId] ?? String(bytesToGigabytes(tenant.quotaBytes));
          const gigabytes = Number(value);
          return [tenant.tenantId, Number.isFinite(gigabytes) && gigabytes > 0];
        }),
      );
    }),
  })),
  withMethods(
    (
      store,
      storageRepo = inject(STORAGE_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => {
      const replaceTenant = (updated: { tenantId: string }): void => {
        patchState(store, {
          tenants: store
            .tenants()
            .map((tenant) =>
              tenant.tenantId === updated.tenantId ? { ...tenant, ...updated } : tenant,
            ),
        });
      };

      return {
        /** Carga la primera página de tenants con almacenamiento. */
        load: rxMethod<void>(
          pipe(
            tap(() => patchState(store, { loading: true, error: null })),
            switchMap(() =>
              storageRepo.list().pipe(
                tap((page) =>
                  patchState(store, {
                    tenants: page.items,
                    total: page.total,
                    page: page.page,
                    pages: page.pages,
                    loading: false,
                    error: null,
                  }),
                ),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo cargar el almacenamiento.';
                  patchState(store, { loading: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        /** Ajusta la cuota mensual de un tenant. */
        updateQuota: rxMethod<{ tenantId: string; quotaBytes: number }>(
          pipe(
            tap(({ tenantId }) => patchState(store, { savingId: tenantId, error: null })),
            switchMap(({ tenantId, quotaBytes }) =>
              storageRepo.update(tenantId, { quotaBytes }).pipe(
                tap((updated) => {
                  replaceTenant(updated);
                  patchState(store, { savingId: null, error: null });
                  notificationService.showSuccess('Cuota de almacenamiento actualizada.');
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo actualizar el almacenamiento.';
                  patchState(store, { savingId: null, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        /** Suspende o reactiva el almacenamiento de un tenant. */
        setStatus: rxMethod<{ tenantId: string; status: StorageTenantStatus }>(
          pipe(
            tap(({ tenantId }) => patchState(store, { savingId: tenantId, error: null })),
            switchMap(({ tenantId, status }) =>
              storageRepo.update(tenantId, { status }).pipe(
                tap((updated) => {
                  replaceTenant(updated);
                  patchState(store, { savingId: null, error: null });
                  notificationService.showSuccess(
                    status === 'activo'
                      ? 'Almacenamiento reactivado.'
                      : 'Almacenamiento suspendido.',
                  );
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo actualizar el almacenamiento.';
                  patchState(store, { savingId: null, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        /** Recalcula el uso desde la metadata del almacenamiento. */
        recalculate: rxMethod<string>(
          pipe(
            tap((tenantId) => patchState(store, { recalculatingId: tenantId, error: null })),
            switchMap((tenantId) =>
              storageRepo.recalculate(tenantId).pipe(
                tap((updated) => {
                  replaceTenant(updated);
                  patchState(store, { recalculatingId: null, error: null });
                  notificationService.showSuccess('Uso de almacenamiento recalculado.');
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo recalcular el uso.';
                  patchState(store, { recalculatingId: null, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        /** Guarda el borrador de cuota de un tenant. */
        setQuotaDraft(tenantId: string, value: string): void {
          patchState(store, { quotaDrafts: { ...store.quotaDrafts(), [tenantId]: value } });
        },

        /** Descarta el borrador cuando la cuota ya se guardó. */
        clearQuotaDraft(tenantId: string): void {
          const next = { ...store.quotaDrafts() };
          delete next[tenantId];
          patchState(store, { quotaDrafts: next });
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
