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

export interface OrderItem {
  productId: string | number;
  name: string;
  price: number;
  quantity: number;
}

export interface CreateOrderPayload {
  items: OrderItem[];
  shipping: ShippingAddress;
  payment: Omit<PaymentDetails, 'cvv'> & { last4: string };
  total: number;
  discountAmount?: number;
  couponCode?: string | null;
}

export interface OrderResponse {
  id: string | number;
  orderNumber: string;
  status: 'confirmed' | 'pending' | 'completed';
  total: number;
  createdAt: string;
}
