import { inject, untracked } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { STORAGE_REPOSITORY } from '../../../storage/public-api';
import { COMPANY_REPOSITORY } from '../../repositories/company.repository';
import { CompanyStore } from '../company/company.store';
import type { CompanyLogoState } from './company-logo.state';

const initialState: CompanyLogoState = {
  uploading: false,
  error: null,
};

/**
 * Subida del logo de la empresa: storage-service → objeto confirmado →
 * `logo_objeto_id` en identity-service. Vive al alcance de la página de
 * configuración para no arrastrar storage al resto del workspace.
 */
export const CompanyLogoStore = signalStore(
  withState(initialState),
  withMethods(
    (
      store,
      storageRepo = inject(STORAGE_REPOSITORY),
      companyRepo = inject(COMPANY_REPOSITORY),
      companyStore = inject(CompanyStore),
      notificationService = inject(NotificationService),
    ) => ({
      /** Solicita URL prefirmada, sube el archivo, lo confirma y lo asocia. */
      upload: rxMethod<File>(
        pipe(
          tap(() => patchState(store, { uploading: true, error: null })),
          switchMap((file) => {
            const company = untracked(() => companyStore.company());
            if (!company) {
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
                folder: 'empresa/logo',
                description: `Logo de ${company.name}`,
              })
              .pipe(
                switchMap((upload) => {
                  if (upload.maxBytes > 0 && file.size > upload.maxBytes) {
                    return throwError(
                      () => new Error('El logo supera el tamaño máximo permitido.'),
                    );
                  }
                  return storageRepo
                    .uploadToUrl(upload.uploadUrl, upload.headers, file)
                    .pipe(map(() => upload.objectId));
                }),
                switchMap((objectId) => storageRepo.confirm(objectId)),
                switchMap((object) =>
                  companyRepo.updateProfile(company.id, { logoObjectId: object.id }),
                ),
                tap((updated) => {
                  companyStore.applyCompanyUpdate(updated);
                  patchState(store, { uploading: false, error: null });
                  notificationService.showSuccess('Logo actualizado.');
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo subir el logo.';
                  patchState(store, { uploading: false, error: message });
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
    }),
  ),
);
