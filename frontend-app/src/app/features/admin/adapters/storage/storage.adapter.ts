import { unwrapApiListResponse } from '../../../../core/models/api-response.dto';
import { BackendStoragePageDTO, BackendStorageTenantDTO } from '../../models/storage.dto';
import { StoragePage, StorageTenant, StorageTenantStatus } from '../../models/storage.model';

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0;
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toStatus(value: unknown): StorageTenantStatus {
  return value === 'suspendido' ? 'suspendido' : 'activo';
}

/** Normaliza un tenant de almacenamiento; `null` si no tiene `tenant_id`. */
export function adaptStorageTenantFromBackend(raw: unknown): StorageTenant | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const tenant = raw as BackendStorageTenantDTO;
  const tenantId = tenant.tenant_id ?? tenant.tenantId;
  if (!tenantId) return null;

  return {
    tenantId: String(tenantId),
    bucket: toText(tenant.bucket),
    quotaBytes: toNumber(tenant.cuota_bytes ?? tenant.cuotaBytes),
    usedBytes: toNumber(tenant.usado_bytes ?? tenant.usadoBytes),
    availableBytes: toNumber(tenant.disponible_bytes ?? tenant.disponibleBytes),
    objects: toNumber(tenant.objetos),
    status: toStatus(tenant.estado),
    createdAt: toText(tenant.creado_en ?? tenant.creadoEn),
    updatedAt: toText(tenant.actualizado_en ?? tenant.actualizadoEn),
  };
}

/** Normaliza una página de tenants de almacenamiento. */
export function adaptStoragePageFromBackend(response: unknown): StoragePage {
  if (!response || typeof response !== 'object') {
    return { items: [], total: 0, page: 1, limit: 20, pages: 0 };
  }

  const page = response as BackendStoragePageDTO;
  const rawItems = Array.isArray(page.items)
    ? page.items
    : unwrapApiListResponse<unknown>(response);
  const items = rawItems
    .map((raw) => adaptStorageTenantFromBackend(raw))
    .filter((tenant): tenant is StorageTenant => tenant !== null);
  const limit = toNumber(page.limite) || 20;
  const sourceTotal =
    page.total === undefined || page.total === null ? items.length : toNumber(page.total);

  return {
    items,
    total: sourceTotal,
    page: toNumber(page.pagina) || 1,
    limit,
    pages: toNumber(page.paginas) || Math.ceil(sourceTotal / limit),
  };
}
