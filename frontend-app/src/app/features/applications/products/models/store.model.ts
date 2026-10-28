/**
 * Tienda (tenant) de Core Engine. El backend es **multi-tienda**: cada vendedor
 * tiene una tienda y publica sus propias ofertas. El storefront resuelve la
 * tienda desde la URL (`/tienda/:storeId`), nunca desde configuración estática.
 */
export interface Store {
  id: string;
  /** Slug público; el id sigue siendo la clave interna del dominio. */
  slug?: string;
  vendorId: string;
  name: string;
  description: string;
  /** Empresa propietaria (`empresa_id`); presente en la ficha del vendedor. */
  companyId?: string;
  companySlug?: string;
  /** Usuario propietario operativo (`propietario_usuario_id`). */
  ownerUserId?: string;
  /** Participación del vendedor sobre las ventas (0–100). */
  participationPercentage?: number;
  /** Fecha de creación ISO 8601 UTC. */
  createdAt?: string;
}
