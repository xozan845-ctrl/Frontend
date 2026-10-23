import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { StoragePage, StorageTenant, StorageTenantChanges } from '../models/storage.model';

/** Puerto de administración de almacenamiento (`/admin/storage`). */
export interface StorageRepository {
  /** Tenants con bucket, cuota y uso (primera página). */
  list(): Observable<StoragePage>;
  /** Ajusta cuota o estado de un tenant. */
  update(tenantId: string, changes: StorageTenantChanges): Observable<StorageTenant>;
  /** Recalcula el uso desde la metadata del almacenamiento. */
  recalculate(tenantId: string): Observable<StorageTenant>;
}

export const STORAGE_REPOSITORY = new InjectionToken<StorageRepository>('StorageRepository');
