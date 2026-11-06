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
