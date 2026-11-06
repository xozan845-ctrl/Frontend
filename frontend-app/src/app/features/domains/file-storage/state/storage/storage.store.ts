import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, forkJoin, pipe } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { storageBucketUsage } from '../../models/storage.model';
import { STORAGE_REPOSITORY } from '../../repositories/storage.repository';
import type { StorageState } from './storage.state';

const initialState: StorageState = {
  bucket: null,
  objects: [],
  loading: false,
  error: null,
  uploading: false,
  downloadingId: null,
  deletingId: null,
  pendingDeleteId: null,
  query: '',
  statusFilter: null,
  downloadUrl: null,
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Almacenamiento del tenant (ADR-42): bucket, objetos, subida prefirmada,
 * descarga y borrado.
 */
export const StorageStore = signalStore(
  withState(initialState),
  withComputed(({ bucket, objects, query, statusFilter }) => ({
    filteredObjects: computed(() => {
      const needle = normalize(query());
      const status = statusFilter();
      return objects().filter(
        (object) =>
          (!status || object.status === status) &&
          (!needle ||
            [object.name, object.folder, object.description]
              .map(normalize)
              .some((value) => value.includes(needle))),
      );
    }),
    bucketUsage: computed(() => storageBucketUsage(bucket())),
    activeObjects: computed(() => objects().filter((object) => object.status === 'activo').length),
    hasObjects: computed(() => objects().length > 0),
  })),
  withMethods(
    (
      store,
      storageRepo = inject(STORAGE_REPOSITORY),
      notificationService = inject(NotificationService),
    ) => {
      /** Carga bucket y objetos en paralelo. */
      const load = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            forkJoin({
              bucket: storageRepo.bucket(),
              objects: storageRepo.objects(),
            }).pipe(
              tap(({ bucket, objects }) =>
                patchState(store, {
                  bucket,
                  objects: objects.items,
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
      );

      return {
        load,

        /** Solicita URL prefirmada, sube el archivo y confirma el objeto. */
        upload: rxMethod<{
          name: string;
          contentType: string;
          sizeBytes: number;
          folder?: string;
          description?: string;
          file: File;
        }>(
          pipe(
            tap(() => patchState(store, { uploading: true, error: null })),
            switchMap(({ file, ...data }) =>
              storageRepo.requestUpload(data).pipe(
                switchMap((upload) =>
                  storageRepo
                    .uploadToUrl(upload.uploadUrl, upload.headers, file)
                    .pipe(map(() => upload.objectId)),
                ),
                switchMap((objectId) => storageRepo.confirm(objectId)),
                tap(() => {
                  patchState(store, { uploading: false, error: null });
                  notificationService.showSuccess('Archivo subido.');
                  load();
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo subir el archivo.';
                  patchState(store, { uploading: false, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        /** Obtiene una URL prefirmada de descarga; la página la abre. */
        download: rxMethod<string>(
          pipe(
            tap((id) => patchState(store, { downloadingId: id, error: null })),
            switchMap((id) =>
              storageRepo.download(id).pipe(
                tap((download) =>
                  patchState(store, {
                    downloadingId: null,
                    downloadUrl: download.url,
                    error: null,
                  }),
                ),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo descargar el archivo.';
                  patchState(store, { downloadingId: null, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        /** Marca un objeto para confirmar el borrado inline. */
        requestDelete(objectId: string): void {
          patchState(store, { pendingDeleteId: objectId });
        },

        cancelDelete(): void {
          patchState(store, { pendingDeleteId: null });
        },

        /** Elimina el objeto y refresca bucket/objetos. */
        delete: rxMethod<string>(
          pipe(
            tap((id) => patchState(store, { deletingId: id, pendingDeleteId: null, error: null })),
            switchMap((id) =>
              storageRepo.delete(id).pipe(
                tap(() => {
                  patchState(store, { deletingId: null, error: null });
                  notificationService.showSuccess('Archivo eliminado.');
                  load();
                }),
                catchError((err: Error) => {
                  const message = err.message || 'No se pudo eliminar el archivo.';
                  patchState(store, { deletingId: null, error: message });
                  notificationService.showError(message);
                  return EMPTY;
                }),
              ),
            ),
          ),
        ),

        setQuery(query: string): void {
          patchState(store, { query });
        },

        setStatusFilter(status: string | null): void {
          patchState(store, { statusFilter: status });
        },

        clearDownload(): void {
          patchState(store, { downloadUrl: null });
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
