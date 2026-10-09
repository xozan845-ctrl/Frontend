/**
 * DTO de la tienda del vendedor tal como la devuelve Core Engine
 * (`POST /vendedores/tienda`, `GET /vendedores/me/tienda`). Tolerante a
 * `snake_case`/`camelCase` (`R-NC-9`).
 */
export interface BackendTiendaDTO {
  id?: string | number | null;
  vendedor_id?: string | number | null;
  vendorId?: string | number | null;
  nombre?: string;
  descripcion?: string;
}

/** DTO de un producto del catálogo global (`GET /catalog/productos`, `R-NC-9`). */
export interface BackendProductoCatalogoDTO {
  id?: string | number | null;
  nombre?: string;
  sku?: string;
}
