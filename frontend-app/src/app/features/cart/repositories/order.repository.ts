import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateOrderPayload, OrderResponse, OrderTimelineEvent } from '../models/order.model';

export interface OrderRepository {
  /** Crea una orden desde el carrito (`POST /orders`). */
  createOrder(payload: CreateOrderPayload): Observable<OrderResponse>;
  /** Historial de órdenes del comprador (`GET /orders`). */
  getOrders(): Observable<OrderResponse[]>;
  /** Detalle de una orden (`GET /orders/:id`). */
  getOrder(id: string): Observable<OrderResponse>;
  /** Timeline de eventos de una orden (`GET /orders/:id/timeline`). */
  getTimeline(id: string): Observable<OrderTimelineEvent[]>;
}

export const ORDER_REPOSITORY = new InjectionToken<OrderRepository>('OrderRepository');
