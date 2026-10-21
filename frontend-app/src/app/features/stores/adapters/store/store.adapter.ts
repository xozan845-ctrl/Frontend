import { Store } from '../../../products/public-api';
import { CatalogProductOption } from '../../models/store-wizard.model';
import { BackendProductoCatalogoDTO, BackendTiendaDTO } from '../../models/store.dto';
import {
  unwrapApiListResponse,
  unwrapApiSingleResponse,
} from '../../../../core/models/api-response.dto';

/**
 * Tienda del vendedor (`POST /vendedores/tienda`, `GET /vendedores/me/tienda`).
 * Tolerante a `snake_case`/`camelCase` y al envelope `{ data }`; `null` si no
 * hay id.
 */
export function adaptStoreFromBackend(raw: unknown): Store | null {
  const tienda = unwrapApiSingleResponse<BackendTiendaDTO>(raw);
  if (!tienda || typeof tienda !== 'object') return null;
  const id = tienda.id;
  if (id === null || id === undefined || id === '') return null;

  return {
    id: String(id),
    vendorId: String(tienda.vendedor_id ?? tienda.vendorId ?? ''),
    name: typeof tienda.nombre === 'string' ? tienda.nombre : 'Tienda',
    description: typeof tienda.descripcion === 'string' ? tienda.descripcion : '',
    ...(tienda.empresa_id !== null && tienda.empresa_id !== undefined && tienda.empresa_id !== ''
      ? { companyId: String(tienda.empresa_id) }
      : {}),
    ...(tienda.propietario_usuario_id !== null &&
    tienda.propietario_usuario_id !== undefined &&
    tienda.propietario_usuario_id !== ''
      ? { ownerUserId: String(tienda.propietario_usuario_id) }
      : {}),
    ...(tienda.participacion_porcentaje !== null &&
    tienda.participacion_porcentaje !== undefined &&
    Number.isFinite(Number(tienda.participacion_porcentaje))
      ? { participationPercentage: Number(tienda.participacion_porcentaje) }
      : {}),
    ...(typeof tienda.creado_en === 'string' && tienda.creado_en
      ? { createdAt: tienda.creado_en }
      : {}),
  };
}

/** Catálogo global de productos como opciones para publicar (`GET /catalog/productos`). */
export function adaptCatalogOptionsFromBackend(response: unknown): CatalogProductOption[] {
  return unwrapApiListResponse<unknown>(response)
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const producto = raw as BackendProductoCatalogoDTO;
      const id = producto.id;
      if (id === null || id === undefined || id === '') return null;
      return {
        id: String(id),
        name: typeof producto.nombre === 'string' ? producto.nombre : 'Producto',
        sku: typeof producto.sku === 'string' ? producto.sku : '',
      };
    })
    .filter((option): option is CatalogProductOption => option !== null);
}
