export interface OrderItemRequest {
  ofertaId: string | number;
  quantity: number;
}

/** Comando de creación de orden de Core Engine (`POST /orders`). */
export interface CreateOrderPayload {
  items?: OrderItemRequest[];
  /** Crea la orden desde el carrito del servidor y lo vacía (RN-05). */
  usarCarrito?: boolean;
}

/** Línea de una orden (`OrderView.items`). */
export interface OrderItem {
  ofertaId: string;
  sku: string;
  name: string;
  quantity: number;
  /** Precio unitario final en córdobas. */
  unitPrice: number;
  storeId: string;
}

/** Orden de Core Engine (`OrderViewResponseDto`). */
export interface OrderResponse {
  id: string | number;
  /** Referencia visible derivada del id (el contrato no expone `order_number`). */
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  storeId?: string;
  buyerId?: string;
  /** Nombre del comprador cuando el contrato lo expone. */
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  buyerCompany?: string;
  sellerId?: string;
  /** Comisión de plataforma en córdobas (`comision_cents / 100`). */
  commission?: number;
  currency?: string;
  /** Dirección de envío tal como la devuelve el backend. */
  shippingAddress?: unknown;
  items?: OrderItem[];
  updatedAt?: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  returnedAt?: string;
}

/** Resultado de avanzar el estado de una orden (`PATCH /orders/:id/estado`). */
export interface OrderStatusUpdate {
  id: string;
  status: string;
}

/** Evento del timeline de una orden (`GET /orders/:id/timeline`). */
export interface OrderTimelineEvent {
  id: number;
  type: string;
  payload: unknown;
  version: number;
  createdAt: string;
}

/** Etiquetas legibles de los estados de orden del contrato. */
const ORDER_STATUS_LABELS: Readonly<Record<string, string>> = {
  creada: 'Creada',
  pendiente: 'Pendiente',
  pagada: 'Pagada',
  en_preparacion: 'En preparación',
  enviada: 'Enviada',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
  devuelta: 'Devuelta',
};

/** Traduce un estado de orden a una etiqueta para la UI (fallback al original). */
export function orderStatusLabel(status: string | undefined | null): string {
  if (!status) return '';
  return ORDER_STATUS_LABELS[status] ?? status;
}
