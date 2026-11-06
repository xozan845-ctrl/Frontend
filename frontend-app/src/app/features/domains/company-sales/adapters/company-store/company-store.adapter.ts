import { unwrapApiListResponse } from '../../../../../core/models/api-response.dto';
import { BackendCompanyStoreDTO } from '../../models/company-store.dto';
import { CompanyStore } from '../../models/company-store.model';

function toText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0;
}

/** Normaliza una tienda de la empresa; `null` sin id. */
export function adaptCompanyStoreFromBackend(raw: unknown): CompanyStore | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const store = raw as BackendCompanyStoreDTO;
  if (!store.id) return null;

  return {
    id: String(store.id),
    companyId: toText(store.empresa_id ?? store.empresaId),
    ownerUserId: toText(store.propietario_usuario_id ?? store.propietarioUsuarioId),
    sellerId: toText(store.vendedor_id ?? store.vendedorId),
    name: toText(store.nombre) || 'Tienda',
    description: toText(store.descripcion),
    participationPercentage: toNumber(
      store.participacion_porcentaje ?? store.participacionPorcentaje,
    ),
    createdAt: toText(store.creado_en ?? store.creadoEn),
  };
}

/** Lista de tiendas de la empresa tolerante a array o envelopes. */
export function adaptCompanyStoresFromBackend(response: unknown): CompanyStore[] {
  return unwrapApiListResponse<unknown>(response)
    .map((raw) => adaptCompanyStoreFromBackend(raw))
    .filter((store): store is CompanyStore => store !== null);
}
