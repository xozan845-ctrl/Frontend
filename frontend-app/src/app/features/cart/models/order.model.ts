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
  /** Precio unitario final en córdobas (backend envía centavos). */
  unitPrice: number;
  storeId: string;
}

/** Orden de Core Engine (`OrderView`). */
export interface OrderResponse {
  id: string | number;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  storeId?: string;
  items?: OrderItem[];
}

/** Evento del timeline de una orden (`GET /orders/:id/timeline`). */
export interface OrderTimelineEvent {
  id: number;
  type: string;
  payload: unknown;
  version: number;
  createdAt: string;
}
