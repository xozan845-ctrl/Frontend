/** Estado del almacenamiento de un tenant. */
export type StorageTenantStatus = 'activo' | 'suspendido';

/** Estado de bucket/uso de un tenant (`EstadoBucketResponseDto`). */
export interface StorageTenant {
  tenantId: string;
  bucket: string;
  quotaBytes: number;
  usedBytes: number;
  availableBytes: number;
  objects: number;
  status: StorageTenantStatus;
  createdAt: string;
  updatedAt: string;
}

/** Página de tenants con almacenamiento (`PaginaBucketsResponseDto`). */
export interface StoragePage {
  items: StorageTenant[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Cambios admitidos por `PATCH /admin/storage/tenants/:id`. */
export interface StorageTenantChanges {
  quotaBytes?: number;
  status?: StorageTenantStatus;
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
const BYTES_PER_GB = 1024 ** 3;

/** Formatea bytes en unidades binarias legibles (`1.50 GB`). */
export function formatBytes(bytes: number): string {
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

/** Convierte bytes a GB para el formulario de cuota. */
export function bytesToGigabytes(bytes: number): number {
  return Math.round((bytes / BYTES_PER_GB) * 100) / 100;
}

/** Convierte GB del formulario a bytes enteros. */
export function gigabytesToBytes(gigabytes: number): number {
  return Math.round(gigabytes * BYTES_PER_GB);
}

/** Porcentaje de uso (0–100) para la barra de cuota. */
export function storageUsagePercent(tenant: StorageTenant): number {
  if (!Number.isFinite(tenant.quotaBytes) || tenant.quotaBytes <= 0) return 0;
  return Math.min(100, Math.max(0, (tenant.usedBytes / tenant.quotaBytes) * 100));
}

/** Etiqueta legible del estado del almacenamiento. */
export function storageStatusLabel(status: string): string {
  return status === 'suspendido' ? 'Suspendido' : 'Activo';
}
