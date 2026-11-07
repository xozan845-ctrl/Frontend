import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '@core/services/notification/notification.service';
import { STORAGE_REPOSITORY } from '../../../storage/public-api';
import { COMPANY_REPOSITORY } from '../../repositories/company.repository';
import { CompanyInvitationsStore } from '../company-invitations/company-invitations.store';
import type { SellerAvatarState } from './seller-avatar.state';

const initialState: SellerAvatarState = {
  uploadingSellerId: null,
  error: null,
};

/**
 * Avatar de vendedor: storage-service → objeto público → `PATCH /usuarios/:id/avatar`.
 * El empresario administra el avatar desde el listado de vendedores.
 */
export const SellerAvatarStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      storageRepo = inject(STORAGE_REPOSITORY),
      companyRepo = inject(COMPANY_REPOSITORY),
      invitations = inject(CompanyInvitationsStore),
      notificationService = inject(NotificationService),
    ) => ({
      upload: rxMethod<{ sellerId: string; file: File }>(
        pipe(
          tap(({ sellerId }) => patchState(store, { uploadingSellerId: sellerId, error: null })),
          switchMap(({ sellerId, file }) => {
            if (!file.type.startsWith('image/')) {
              const message = 'El avatar debe ser una imagen.';
              patchState(store, { uploadingSellerId: null, error: message });
              notificationService.showError(message);
              return EMPTY;
            }

            return storageRepo
              .requestUpload({
                name: file.name,
                contentType: file.type,
                sizeBytes: file.size,
                folder: 'avatares',
                isPublic: true,
                description: 'Avatar del vendedor',
              })
              .pipe(
                switchMap((upload) =>
                  storageRepo
                    .uploadToUrl(upload.uploadUrl, upload.headers, file)
                    .pipe(map(() => upload.objectId)),
                ),
                switchMap((objectId) => storageRepo.confirm(objectId)),
                switchMap((object) => companyRepo.updateSellerAvatar(sellerId, object.id)),
                tap((avatar) => {
                  invitations.applySellerAvatar(sellerId, avatar);
                  patchState(store, { uploadingSellerId: null, error: null });
                  notificationService.showSuccess('Avatar actualizado.');
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo actualizar el avatar.';
                  patchState(store, { uploadingSellerId: null, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              );
          }),
        ),
      ),

      remove: rxMethod<string>(
        pipe(
          tap((sellerId) => patchState(store, { uploadingSellerId: sellerId, error: null })),
          switchMap((sellerId) =>
            companyRepo.updateSellerAvatar(sellerId, null).pipe(
              tap((avatar) => {
                invitations.applySellerAvatar(sellerId, avatar);
                patchState(store, { uploadingSellerId: null, error: null });
                notificationService.showSuccess('Avatar eliminado.');
              }),
              catchError((err: Error) => {
                const message = err.message || 'No se pudo quitar el avatar.';
                patchState(store, { uploadingSellerId: null, error: message });
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
