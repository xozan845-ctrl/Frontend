/** API pública del feature `storage` para el shell que monta sus rutas. */
export { STORAGE_ROUTES } from './storage.routes';
export { STORAGE_REPOSITORY, type StorageRepository } from './repositories/storage.repository';
export { StorageService, storagePublicObjectUrl } from './services/storage/storage.service';
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
