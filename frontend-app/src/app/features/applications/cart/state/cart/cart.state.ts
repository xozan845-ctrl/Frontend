import type { CartItem } from '../../models/cart.model';
import type { OrderResponse } from '../../models/order.model';

export interface CartState {
  items: CartItem[];
  /** Total autoritativo del servidor; 0 en el carrito local del invitado. */
  total: number;
  /** Expiración de la reserva del servidor (ISO 8601 UTC). */
  expiresAt: string | null;
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
