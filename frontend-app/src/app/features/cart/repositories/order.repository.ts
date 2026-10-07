import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateOrderPayload, OrderResponse } from '../models/order.model';

export interface OrderRepository {
  createOrder(payload: CreateOrderPayload): Observable<OrderResponse>;
}

export const ORDER_REPOSITORY = new InjectionToken<OrderRepository>('OrderRepository');
