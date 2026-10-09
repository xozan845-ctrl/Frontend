import { Store } from '../../products/public-api';
import { CatalogProductOption } from '../models/store-wizard.model';
import { unwrapApiListResponse } from '../../../core/models/api-response.dto';

/**
 * Tienda del vendedor (`POST /vendedores/tienda`, `GET /vendedores/me/tienda`).
 * Tolerante a `snake_case`/`camelCase`; `null` si no hay id.
 */
export function adaptStoreFromBackend(raw: unknown): Store | null {
  if (!raw || typeof raw !== 'object') return null;
  const tienda = raw as Record<string, unknown>;
  const id = tienda['id'];
  if (id === null || id === undefined || id === '') return null;

  return {
    id: String(id),
    vendorId: String(tienda['vendedor_id'] ?? tienda['vendorId'] ?? ''),
    name: typeof tienda['nombre'] === 'string' ? tienda['nombre'] : 'Tienda',
    description: typeof tienda['descripcion'] === 'string' ? tienda['descripcion'] : '',
  };
}

/** Catálogo global de productos como opciones para publicar (`GET /catalog/productos`). */
export function adaptCatalogOptionsFromBackend(response: unknown): CatalogProductOption[] {
  return unwrapApiListResponse(response)
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const producto = raw as Record<string, unknown>;
      const id = producto['id'];
      if (id === null || id === undefined || id === '') return null;
      return {
        id: String(id),
        name: typeof producto['nombre'] === 'string' ? producto['nombre'] : 'Producto',
        sku: typeof producto['sku'] === 'string' ? producto['sku'] : '',
      };
    })
    .filter((option): option is CatalogProductOption => option !== null);
}
