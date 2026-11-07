/**
 * DTO de la tienda del vendedor tal como la devuelve Core Engine
 * (`POST /vendedores/tienda`, `GET /vendedores/me/tienda`). Tolerante a
 * `snake_case`/`camelCase` (`R-NC-9`).
 */
export interface BackendTiendaDTO {
  id?: string | number | null;
  slug?: string | null;
  empresa_slug?: string | null;
  empresa_id?: string | number | null;
  propietario_usuario_id?: string | number | null;
  participacion_porcentaje?: number | string | null;
  vendedor_id?: string | number | null;
  vendorId?: string | number | null;
  nombre?: string;
  descripcion?: string;
  /** Logo de la tienda (storage) si el contrato de tienda lo expone. */
  logo_objeto_id?: string | null;
  logoObjectId?: string | null;
  logo_url?: string | null;
  logoUrl?: string | null;
  imagen_url?: string | null;
  imagenUrl?: string | null;
  /** Logo de la empresa dueña si la ficha de tienda lo expone. */
  empresa_logo_url?: string | null;
  company_logo_url?: string | null;
  companyLogoUrl?: string | null;
  /** Fecha de creación ISO 8601 UTC (no consumida hoy; parte del contrato). */
  creado_en?: string;
}

/** DTO de un producto del catálogo global (`GET /catalog/productos`, `R-NC-9`). */
export interface BackendProductoCatalogoDTO {
  id?: string | number | null;
  nombre?: string;
  sku?: string;
}
