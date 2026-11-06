/** API pública del dominio de almacenamiento (`R-CX-6`). */
export { STORAGE_REPOSITORY, type StorageRepository } from './repositories/storage.repository';
export {
  StorageService,
  resolveStorageAssetUrl,
  storagePublicObjectUrl,
} from './services/storage/storage.service';
export type {
  PresignedUpload,
  StorageBucket,
  StorageDownload,
  StorageObject,
  StorageObjectPage,
  StorageObjectStatus,
  StorageStatus,
  StorageUploadRequest,
} from './models/storage.model';
export {
  formatStorageBytes,
  storageAvailableGigabytes,
  storageBucketUsage,
  storageObjectStatusLabel,
} from './models/storage.model';
export { StorageStore } from './state/storage/storage.store';
