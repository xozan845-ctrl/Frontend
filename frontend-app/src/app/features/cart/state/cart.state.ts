import type { CartItem } from '../models/cart.model';
import type { OrderResponse } from '../models/order.model';

export interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

export interface CartUiState {
  isSidebarOpen: boolean;
}

/** Última orden creada; alimenta la pantalla de confirmación. */
export interface OrderState {
  lastOrder: OrderResponse | null;
}
