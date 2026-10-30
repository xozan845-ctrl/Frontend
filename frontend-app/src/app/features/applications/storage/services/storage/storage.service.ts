import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { toUserMessage } from '../../../../../core/models/api-error';
import {
  adaptPresignedUploadFromBackend,
  adaptStorageBucketFromBackend,
  adaptStorageDownloadFromBackend,
  adaptStorageObjectFromBackend,
  adaptStorageObjectPageFromBackend,
} from '../../adapters/storage/storage.adapter';
import {
  PresignedUpload,
  StorageBucket,
  StorageDownload,
  StorageObject,
  StorageObjectPage,
  StorageUploadRequest,
} from '../../models/storage.model';
import { StorageRepository } from '../../repositories/storage.repository';

/**
 * URL pública de un objeto confirmado. Fallback cuando identity-service no
 * devuelve `logo_url` en `EmpresaResponseDto`.
 */
export function storagePublicObjectUrl(objectId: string): string {
  const base = (environment.apiUrl ?? '').replace(/\/+$/, '');
  const endpoint = environment.apiConfig?.endpoints?.storage || '/storage';
  return `${base}${endpoint}/public/objetos/${encodeURIComponent(objectId)}`;
}

/** Almacenamiento del tenant (`/storage/bucket`, `/storage/objetos`). */
@Injectable({
  providedIn: 'root',
})
export class StorageService implements StorageRepository {
  private readonly http = inject(HttpClient);
  private readonly endpoint = environment.apiConfig.endpoints.storage;

  bucket(): Observable<StorageBucket> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(`${environment.apiUrl}${this.endpoint}/bucket`).pipe(
      map((response) => {
        const bucket = adaptStorageBucketFromBackend(response);
        if (!bucket) throw new Error('No se pudo interpretar el bucket.');
        return bucket;
      }),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo cargar el almacenamiento.'))),
      ),
    );
  }

  objects(): Observable<StorageObjectPage> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(`${environment.apiUrl}${this.endpoint}/objetos`).pipe(
      map((response) => adaptStorageObjectPageFromBackend(response)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudieron cargar los objetos.'))),
      ),
    );
  }

  requestUpload(data: StorageUploadRequest): Observable<PresignedUpload> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(`${environment.apiUrl}${this.endpoint}/subidas`, {
        nombre: data.name,
        content_type: data.contentType,
        tamano_bytes: data.sizeBytes,
        ...(data.folder ? { carpeta: data.folder } : {}),
        ...(data.description ? { descripcion: data.description } : {}),
      })
      .pipe(
        map((response) => {
          const upload = adaptPresignedUploadFromBackend(response);
          if (!upload) throw new Error('No se pudo interpretar la solicitud de subida.');
          return upload;
        }),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo iniciar la subida.'))),
        ),
      );
  }

  uploadToUrl(url: string, headers: Record<string, string>, file: File): Observable<void> {
    return from(this.putFile(url, headers, file)).pipe(
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo subir el archivo.'))),
      ),
    );
  }

  confirm(objectId: string): Observable<StorageObject> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(
        `${environment.apiUrl}${this.endpoint}/objetos/${encodeURIComponent(objectId)}/confirmar`,
        {},
      )
      .pipe(
        map((response) => {
          const object = adaptStorageObjectFromBackend(response);
          if (!object) throw new Error('No se pudo interpretar el objeto.');
          return object;
        }),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo confirmar el archivo.'))),
        ),
      );
  }

  download(objectId: string): Observable<StorageDownload> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .get<unknown>(
        `${environment.apiUrl}${this.endpoint}/objetos/${encodeURIComponent(objectId)}/descarga`,
      )
      .pipe(
        map((response) => {
          const download = adaptStorageDownloadFromBackend(response);
          if (!download) throw new Error('No se pudo interpretar la descarga.');
          return download;
        }),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo descargar el archivo.'))),
        ),
      );
  }

  delete(objectId: string): Observable<void> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .delete<void>(`${environment.apiUrl}${this.endpoint}/objetos/${encodeURIComponent(objectId)}`)
      .pipe(
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo eliminar el archivo.'))),
        ),
      );
  }

  private async putFile(url: string, headers: Record<string, string>, file: File): Promise<void> {
    const response = await fetch(url, { method: 'PUT', headers, body: file });
    if (!response.ok) {
      throw new Error(`La subida falló con estado ${response.status}.`);
    }
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
