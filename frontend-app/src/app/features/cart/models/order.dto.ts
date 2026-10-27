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

export interface BackendOrderBuyerDTO {
  nombre?: string | null;
  nombre_completo?: string | null;
  name?: string | null;
  telefono?: string | null;
  phone?: string | null;
  email?: string | null;
  correo?: string | null;
  empresa?: string | null;
  company?: string | null;
}

export interface BackendOrderDTO {
  id?: string | number | null;
  _id?: string | number | null;
  orderNumber?: string;
  order_number?: string;
  vendedor_id?: string | number | null;
  vendedorId?: string | number | null;
  comprador_id?: string | number | null;
  compradorId?: string | number | null;
  comprador_nombre?: string | null;
  compradorNombre?: string | null;
  buyerName?: string | null;
  comprador_telefono?: string | null;
  compradorTelefono?: string | null;
  buyerPhone?: string | null;
  comprador_email?: string | null;
  compradorEmail?: string | null;
  buyerEmail?: string | null;
  comprador_empresa?: string | null;
  compradorEmpresa?: string | null;
  buyerCompany?: string | null;
  comprador?: BackendOrderBuyerDTO | null;
  estado?: string;
  status?: string;
  total_cents?: number | null;
  total?: number | string | null;
  amount?: number | string | null;
  comision_cents?: number | null;
  comision?: number | string | null;
  moneda?: string;
  currency?: string;
  direccion_envio?: unknown;
  shippingAddress?: unknown;
  creado_en?: string;
  createdAt?: string;
  created_at?: string;
  actualizado_en?: string;
  updatedAt?: string;
  pagada_en?: string;
  paidAt?: string;
  enviada_en?: string;
  shippedAt?: string;
  entregada_en?: string;
  deliveredAt?: string;
  cancelada_en?: string;
  cancelledAt?: string;
  devuelta_en?: string;
  returnedAt?: string;
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
