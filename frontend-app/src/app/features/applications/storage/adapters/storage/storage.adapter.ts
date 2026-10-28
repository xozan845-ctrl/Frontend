import { unwrapApiListResponse } from '../../../../../core/models/api-response.dto';
import {
  BackendPresignedUploadDTO,
  BackendStorageBucketDTO,
  BackendStorageDownloadDTO,
  BackendStorageObjectDTO,
  BackendStorageObjectPageDTO,
} from '../../models/storage.dto';
import {
  PresignedUpload,
  StorageBucket,
  StorageDownload,
  StorageObject,
  StorageObjectPage,
  StorageObjectStatus,
  StorageStatus,
} from '../../models/storage.model';

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0;
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toStatus(value: unknown): StorageStatus {
  return value === 'suspendido' ? 'suspendido' : 'activo';
}

function toObjectStatus(value: unknown): StorageObjectStatus {
  if (value === 'pendiente') return 'pendiente';
  if (value === 'eliminado') return 'eliminado';
  return 'activo';
}

function toTags(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, tag]) => typeof tag === 'string')
      .map(([key, tag]) => [key, String(tag)]),
  );
}

/** Normaliza el bucket del tenant; `null` si no tiene bucket. */
export function adaptStorageBucketFromBackend(raw: unknown): StorageBucket | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const bucket = raw as BackendStorageBucketDTO;
  if (!bucket.bucket) return null;

  return {
    tenantId: toText(bucket.tenant_id ?? bucket.tenantId),
    bucket: bucket.bucket,
    quotaBytes: toNumber(bucket.cuota_bytes ?? bucket.cuotaBytes),
    usedBytes: toNumber(bucket.usado_bytes ?? bucket.usadoBytes),
    availableBytes: toNumber(bucket.disponible_bytes ?? bucket.disponibleBytes),
    objects: toNumber(bucket.objetos),
    status: toStatus(bucket.estado),
    createdAt: toText(bucket.creado_en ?? bucket.creadoEn),
    updatedAt: toText(bucket.actualizado_en ?? bucket.actualizadoEn),
  };
}

/** Normaliza un objeto de almacenamiento; `null` si no tiene id. */
export function adaptStorageObjectFromBackend(raw: unknown): StorageObject | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const object = raw as BackendStorageObjectDTO;
  if (!object.id) return null;

  return {
    id: String(object.id),
    bucket: toText(object.bucket),
    key: toText(object.objeto),
    name: toText(object.nombre),
    contentType: toText(object.content_type ?? object.contentType),
    folder: toText(object.carpeta),
    description: toText(object.descripcion),
    tags: toTags(object.etiquetas),
    sizeBytes: toNumber(object.tamano_bytes ?? object.tamanoBytes),
    status: toObjectStatus(object.estado),
    uploadedBy: toText(object.subido_por ?? object.subidoPor) || null,
    createdAt: toText(object.creado_en ?? object.creadoEn),
    confirmedAt: toText(object.confirmado_en ?? object.confirmadoEn) || null,
    deletedAt: toText(object.eliminado_en ?? object.eliminadoEn) || null,
  };
}

/** Normaliza una página de objetos. */
export function adaptStorageObjectPageFromBackend(response: unknown): StorageObjectPage {
  if (!response || typeof response !== 'object') {
    return { items: [], total: 0, page: 1, limit: 20, pages: 0 };
  }

  const page = response as BackendStorageObjectPageDTO;
  const rawItems = Array.isArray(page.items)
    ? page.items
    : unwrapApiListResponse<unknown>(response);
  const items = rawItems
    .map((raw) => adaptStorageObjectFromBackend(raw))
    .filter((object): object is StorageObject => object !== null);
  const limit = toNumber(page.limite) || 20;
  const total =
    page.total === undefined || page.total === null ? items.length : toNumber(page.total);

  return {
    items,
    total,
    page: toNumber(page.pagina) || 1,
    limit,
    pages: toNumber(page.paginas) || Math.ceil(total / limit),
  };
}

/** Normaliza la solicitud de subida prefirmada. */
export function adaptPresignedUploadFromBackend(raw: unknown): PresignedUpload | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const upload = raw as BackendPresignedUploadDTO;
  const objectId = upload.objeto_id ?? upload.objetoId;
  const url = upload.url_subida ?? upload.urlSubida;
  if (!objectId || !url) return null;

  return {
    objectId: String(objectId),
    bucket: toText(upload.bucket),
    key: toText(upload.objeto),
    uploadUrl: url,
    method: toText(upload.metodo) || 'PUT',
    headers: upload.headers ?? {},
    expiresAt: toText(upload.expira_en ?? upload.expiraEn),
    maxBytes: toNumber(upload.max_bytes ?? upload.maxBytes),
  };
}

/** Normaliza la URL prefirmada de descarga. */
export function adaptStorageDownloadFromBackend(raw: unknown): StorageDownload | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const download = raw as BackendStorageDownloadDTO;
  const url = download.url_descarga ?? download.urlDescarga;
  if (!url) return null;

  return {
    url,
    expiresAt: toText(download.expira_en ?? download.expiraEn),
    name: toText(download.nombre),
    contentType: toText(download.content_type ?? download.contentType),
    sizeBytes: toNumber(download.tamano_bytes ?? download.tamanoBytes),
  };
}
