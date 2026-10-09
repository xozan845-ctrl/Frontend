/**
 * DTO del carrito del servidor de Core Engine
 * (`/carrito` → `{ items, total, expira_en }`). Tolerante a `snake_case`/
 * `camelCase`, tipos string numéricos y envelope `{ data }` (`R-NC-9`).
 */
export interface BackendCarritoItemDTO {
  oferta_id?: string | number | null;
  id?: string | number | null;
  cantidad?: number | string | null;
  producto_nombre?: string;
  precio_venta?: number | string | null;
  precio_base?: number | string | null;
  stock?: number | string | null;
  sku?: string;
}

export interface BackendCarritoDTO {
  items?: BackendCarritoItemDTO[];
}
