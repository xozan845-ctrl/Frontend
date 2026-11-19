import type { CartItem } from '../../models/cart.model';
import type { OrderResponse } from '@domains/orders/public-api';

export interface CartState {
  items: CartItem[];
  /** Total autoritativo del servidor; `null` si no hay total válido o el carrito es local. */
  total: number | null;
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
