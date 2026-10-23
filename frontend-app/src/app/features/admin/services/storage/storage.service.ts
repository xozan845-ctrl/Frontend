import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { toUserMessage } from '../../../../core/models/api-error';
import {
  adaptStoragePageFromBackend,
  adaptStorageTenantFromBackend,
} from '../../adapters/storage/storage.adapter';
import { StoragePage, StorageTenant, StorageTenantChanges } from '../../models/storage.model';
import { StorageRepository } from '../../repositories/storage.repository';

/** Administración de buckets y cuotas por tenant (`/admin/storage`). */
@Injectable({
  providedIn: 'root',
})
export class StorageService implements StorageRepository {
  private readonly http = inject(HttpClient);
  private readonly endpoint = environment.apiConfig.endpoints.adminStorage;

  list(): Observable<StoragePage> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(`${environment.apiUrl}${this.endpoint}/tenants`).pipe(
      map((response) => adaptStoragePageFromBackend(response)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo cargar el almacenamiento.'))),
      ),
    );
  }

  update(tenantId: string, changes: StorageTenantChanges): Observable<StorageTenant> {
    if (!environment.apiUrl) return this.missingApiUrl();

    const body = {
      ...(changes.quotaBytes !== undefined ? { cuota_bytes: changes.quotaBytes } : {}),
      ...(changes.status !== undefined ? { estado: changes.status } : {}),
    };

    return this.http
      .patch<unknown>(
        `${environment.apiUrl}${this.endpoint}/tenants/${encodeURIComponent(tenantId)}`,
        body,
      )
      .pipe(
        map((response) => this.requireTenant(response)),
        catchError((error: unknown) =>
          throwError(
            () => new Error(toUserMessage(error, 'No se pudo actualizar el almacenamiento.')),
          ),
        ),
      );
  }

  recalculate(tenantId: string): Observable<StorageTenant> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(
        `${environment.apiUrl}${this.endpoint}/tenants/${encodeURIComponent(tenantId)}/recalcular`,
        {},
      )
      .pipe(
        map((response) => this.requireTenant(response)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo recalcular el uso.'))),
        ),
      );
  }

  private requireTenant(response: unknown): StorageTenant {
    const tenant = adaptStorageTenantFromBackend(response);
    if (!tenant) throw new Error('No se pudo interpretar el almacenamiento del tenant.');
    return tenant;
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
