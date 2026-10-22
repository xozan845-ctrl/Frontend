import type { OrderResponse, OrderTimelineEvent } from '../../../cart/public-api';

export interface AdminOrdersState {
  orders: OrderResponse[];
  loading: boolean;
  error: string | null;
  /** Filtro por estado; `null` = todas. */
  statusFilter: string | null;
  selectedOrder: OrderResponse | null;
  timeline: OrderTimelineEvent[];
  selectedLoading: boolean;
  selectedError: string | null;
  /** Cambio de estado en curso. */
  updating: boolean;
}
