/** Estado del bucket del tenant. */
export type StorageStatus = 'activo' | 'suspendido';

/** Estado del objeto en el almacenamiento. */
export type StorageObjectStatus = 'pendiente' | 'activo' | 'eliminado';

/** Bucket y cuota del tenant (`EstadoBucketResponseDto`). */
export interface StorageBucket {
  tenantId: string;
  bucket: string;
  quotaBytes: number;
  usedBytes: number;
  availableBytes: number;
  objects: number;
  status: StorageStatus;
  createdAt: string;
  updatedAt: string;
}

/** Objeto del almacenamiento (`ObjetoStorageResponseDto`). */
export interface StorageObject {
  id: string;
  bucket: string;
  key: string;
  name: string;
  contentType: string;
  folder: string;
  description: string;
  tags: Record<string, string>;
  sizeBytes: number;
  status: StorageObjectStatus;
  uploadedBy: string | null;
  createdAt: string;
  confirmedAt: string | null;
  deletedAt: string | null;
}

/** Página de objetos (`PaginaObjetosResponseDto`). */
export interface StorageObjectPage {
  items: StorageObject[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Datos para solicitar una URL prefirmada de subida. */
export interface StorageUploadRequest {
  name: string;
  contentType: string;
  sizeBytes: number;
  folder?: string;
  description?: string;
}

/** URL prefirmada de subida (`SolicitudSubidaResponseDto`). */
export interface PresignedUpload {
  objectId: string;
  bucket: string;
  key: string;
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  expiresAt: string;
  maxBytes: number;
}

/** URL prefirmada de descarga (`UrlDescargaResponseDto`). */
export interface StorageDownload {
  url: string;
  expiresAt: string;
  name: string;
  contentType: string;
  sizeBytes: number;
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
const BYTES_PER_GB = 1024 ** 3;

/** Formatea bytes en unidades binarias legibles. */
export function formatStorageBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  const decimals = unit === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${BYTE_UNITS[unit]}`;
}

/** Porcentaje de uso del bucket (0–100). */
export function storageBucketUsage(bucket: StorageBucket | null): number {
  if (!bucket || bucket.quotaBytes <= 0) return 0;
  return Math.min(100, Math.max(0, (bucket.usedBytes / bucket.quotaBytes) * 100));
}

/** Cuota disponible en GB. */
export function storageAvailableGigabytes(bucket: StorageBucket | null): number {
  if (!bucket) return 0;
  return Math.max(0, bucket.availableBytes / BYTES_PER_GB);
}

/** Etiqueta legible del estado del objeto. */
export function storageObjectStatusLabel(status: string): string {
  if (status === 'activo') return 'Activo';
  if (status === 'pendiente') return 'Pendiente';
  if (status === 'eliminado') return 'Eliminado';
  return status;
}
