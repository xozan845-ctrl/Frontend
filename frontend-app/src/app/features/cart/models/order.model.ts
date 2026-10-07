export interface ShippingAddress {
  fullName: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
}

export interface PaymentDetails {
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface OrderItemRequest {
  ofertaId: string | number;
  quantity: number;
}

/** Comando de creación de orden de Core Engine (`POST /orders`). */
export interface CreateOrderPayload {
  items: OrderItemRequest[];
  usarCarrito?: boolean;
}

export interface OrderResponse {
  id: string | number;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
}
