/**
 * DTOs de órdenes de Core Engine (`OrderView`, `ItemOrden`, timeline).
 * Tolerantes a `snake_case`/`camelCase`, centavos y envelope `{ data }`
 * (`R-NC-9`).
 */
export interface BackendOrderItemDTO {
  oferta_id?: string | number | null;
  ofertaId?: string | number | null;
  sku?: string;
  producto_nombre?: string;
  cantidad?: number | string | null;
  quantity?: number | string | null;
  precio_unitario_cents?: number | null;
  precio_unitario?: number | string | null;
  unit_price?: number | string | null;
  tienda_id?: string | number | null;
  storeId?: string | number | null;
}

export interface BackendOrderDTO {
  id?: string | number | null;
  _id?: string | number | null;
  orderNumber?: string;
  order_number?: string;
  estado?: string;
  status?: string;
  total_cents?: number | null;
  total?: number | string | null;
  amount?: number | string | null;
  creado_en?: string;
  createdAt?: string;
  created_at?: string;
  tienda_id?: string | number | null;
  items?: BackendOrderItemDTO[];
  data?: BackendOrderDTO;
}

export interface BackendTimelineEventDTO {
  id?: number | string | null;
  tipo?: string;
  type?: string;
  payload?: unknown;
  version?: number | string | null;
  creado_en?: string;
  createdAt?: string;
}
