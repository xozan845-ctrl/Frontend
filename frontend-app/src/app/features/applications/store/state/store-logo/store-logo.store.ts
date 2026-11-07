import { inject, untracked } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { STORAGE_REPOSITORY } from '../../../storage/public-api';
import { STORE_REPOSITORY } from '../../../onboarding/public-api';
import { VendorStoreStore } from '../vendor-store/vendor-store.store';
import type { StoreLogoState } from './store-logo.state';

const initialState: StoreLogoState = {
  uploading: false,
  error: null,
};

/**
 * Logo de la tienda: storage-service → objeto público → `PATCH /tiendas/:id/logo`.
 */
export const StoreLogoStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      storageRepo = inject(STORAGE_REPOSITORY),
      storeRepo = inject(STORE_REPOSITORY),
      vendorStore = inject(VendorStoreStore),
      notificationService = inject(NotificationService),
    ) => ({
      upload: rxMethod<File>(
        pipe(
          tap(() => patchState(store, { uploading: true, error: null })),
          switchMap((file) => {
            const current = untracked(() => vendorStore.store());
            if (!current) {
              patchState(store, { uploading: false });
              return EMPTY;
            }
            if (!file.type.startsWith('image/')) {
              const message = 'El logo debe ser una imagen.';
              patchState(store, { uploading: false, error: message });
              notificationService.showError(message);
              return EMPTY;
            }

            return storageRepo
              .requestUpload({
                name: file.name,
                contentType: file.type,
                sizeBytes: file.size,
                folder: 'tiendas',
                isPublic: true,
                description: `Logo de ${current.name}`,
              })
              .pipe(
                switchMap((upload) =>
                  storageRepo
                    .uploadToUrl(upload.uploadUrl, upload.headers, file)
                    .pipe(map(() => upload.objectId)),
                ),
                switchMap((objectId) => storageRepo.confirm(objectId)),
                switchMap((object) => storeRepo.updateLogo(current.id, object.id)),
                tap((updated) => {
                  vendorStore.applyStoreUpdate(updated);
                  patchState(store, { uploading: false, error: null });
                  notificationService.showSuccess('Logo de la tienda actualizado.');
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo actualizar el logo de la tienda.';
                  patchState(store, { uploading: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              );
          }),
        ),
      ),

      remove: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { uploading: true, error: null })),
          switchMap((storeId) =>
            storeRepo.updateLogo(storeId, null).pipe(
              tap((updated) => {
                vendorStore.applyStoreUpdate(updated);
                patchState(store, { uploading: false, error: null });
                notificationService.showSuccess('Logo de la tienda eliminado.');
              }),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo quitar el logo de la tienda.';
                patchState(store, { uploading: false, error: message });
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
