import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CreateOrderPayload, OrderResponse, OrderTimelineEvent } from '../models/order.model';
import { OrderRepository } from '../repositories/order.repository';
import {
  adaptOrderListFromBackend,
  adaptOrderResponse,
  adaptOrderTimelineFromBackend,
  generateMockOrderResponse,
} from '../adapters/order.adapter';

@Injectable({
  providedIn: 'root',
})
export class OrderService implements OrderRepository {
  private readonly http = inject(HttpClient);
  private readonly orderEndpoint = environment.apiConfig?.endpoints?.orders || '/orders';
  private readonly apiUrl = `${environment.apiUrl}${this.orderEndpoint}`;

  createOrder(payload: CreateOrderPayload): Observable<OrderResponse> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return this.mockOrderSuccess(payload);
    }

    if (!environment.apiUrl) {
      return this.missingApiUrl();
    }

    const body = {
      items: payload.items.map((item) => ({
        oferta_id: item.ofertaId,
        cantidad: item.quantity,
      })),
    };

    return this.http
      .post<unknown>(this.apiUrl, body)
      .pipe(map((response) => adaptOrderResponse(response, 0)));
  }

  /** Historial de órdenes del comprador (`GET /orders`). */
  getOrders(): Observable<OrderResponse[]> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return of([]).pipe(delay(200));
    }

    if (!environment.apiUrl) {
      return this.missingApiUrl();
    }

    return this.http
      .get<unknown>(this.apiUrl)
      .pipe(map((response) => adaptOrderListFromBackend(response)));
  }

  /** Detalle de una orden (`GET /orders/:id`). */
  getOrder(id: string): Observable<OrderResponse> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return of(generateMockOrderResponse(0)).pipe(delay(200));
    }

    if (!environment.apiUrl) {
      return this.missingApiUrl();
    }

    return this.http
      .get<unknown>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => adaptOrderResponse(response, 0)));
  }

  /** Timeline de eventos (`GET /orders/:id/timeline`). */
  getTimeline(id: string): Observable<OrderTimelineEvent[]> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return of([]).pipe(delay(200));
    }

    if (!environment.apiUrl) {
      return this.missingApiUrl();
    }

    return this.http
      .get<unknown>(`${this.apiUrl}/${id}/timeline`)
      .pipe(map((response) => adaptOrderTimelineFromBackend(response)));
  }

  private mockOrderSuccess(_payload: CreateOrderPayload): Observable<OrderResponse> {
    return of(generateMockOrderResponse(0)).pipe(delay(800));
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
