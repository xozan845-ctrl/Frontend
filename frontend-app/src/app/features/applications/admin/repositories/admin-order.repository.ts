import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import type { OrderResponse, OrderStatusUpdate, OrderTimelineEvent } from '../../cart/public-api';

/** Puerto de órdenes para administración (Core Engine `/orders/admin`). */
export interface AdminOrderRepository {
  /** Todas las órdenes (`GET /orders/admin/todas`). */
  listAll(status?: string, limit?: number): Observable<OrderResponse[]>;
  /** Detalle de una orden (`GET /orders/:id`). */
  getOrder(id: string): Observable<OrderResponse>;
  /** Timeline (`GET /orders/:id/timeline`). */
  getTimeline(id: string): Observable<OrderTimelineEvent[]>;
  /** Avanza el estado logístico (`PATCH /orders/:id/estado`). */
  advanceStatus(id: string, status: string, reason?: string): Observable<OrderStatusUpdate>;
}

export const ADMIN_ORDER_REPOSITORY = new InjectionToken<AdminOrderRepository>(
  'AdminOrderRepository',
);
