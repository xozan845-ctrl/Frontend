import type { OrderResponse, OrderTimelineEvent } from '../../cart/public-api';

export interface AccountOrdersState {
  orders: OrderResponse[];
  loading: boolean;
  error: string | null;
}

export interface AccountOrderDetailState {
  order: OrderResponse | null;
  timeline: OrderTimelineEvent[];
  loading: boolean;
  error: string | null;
}
