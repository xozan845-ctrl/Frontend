/**
 * Tienda (tenant) de Core Engine. El backend es **multi-tienda**: cada vendedor
 * tiene una tienda y publica sus propias ofertas. El storefront resuelve la
 * tienda desde la URL (`/tienda/:storeId`), nunca desde configuración estática.
 */
import type { MediaBackgroundConfig } from '@core/models/media-background.model';

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
  /** UUID del objeto de storage con el logo de la tienda. */
  logoObjectId?: string;
  /** URL pública del logo; puede venir derivada del backend. */
  logoUrl?: string;
  /** Logo de la empresa dueña, si el contrato de tienda lo incluye. */
  companyLogoUrl?: string;
  /** Fondo multimedia de la tienda (ADR-38), normalizado por el adapter. */
  background?: MediaBackgroundConfig;
  /** Fecha de creación ISO 8601 UTC. */
  createdAt?: string;
}
