import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  PresignedUpload,
  StorageBucket,
  StorageDownload,
  StorageObject,
  StorageObjectPage,
  StorageUploadRequest,
} from '../models/storage.model';

/** Puerto de almacenamiento del tenant (`/storage`). */
export interface StorageRepository {
  bucket(): Observable<StorageBucket>;
  objects(): Observable<StorageObjectPage>;
  requestUpload(data: StorageUploadRequest): Observable<PresignedUpload>;
  uploadToUrl(url: string, headers: Record<string, string>, file: File): Observable<void>;
  confirm(objectId: string): Observable<StorageObject>;
  download(objectId: string): Observable<StorageDownload>;
  delete(objectId: string): Observable<void>;
}

export const STORAGE_REPOSITORY = new InjectionToken<StorageRepository>('StorageRepository');
