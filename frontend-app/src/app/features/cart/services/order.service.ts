import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { toUserMessage } from '../../../core/models/api-error';
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
  private readonly orderEndpoint = environment.apiConfig.endpoints.orders;
  private readonly apiUrl = `${environment.apiUrl}${this.orderEndpoint}`;

  createOrder(payload: CreateOrderPayload): Observable<OrderResponse> {
    if (this.isMock()) {
      return this.mockOrderSuccess(payload);
    }

    if (!environment.apiUrl) {
      return this.missingApiUrl();
    }

    const body = payload.usarCarrito
      ? { usar_carrito: true }
      : {
          items: (payload.items ?? []).map((item) => ({
            oferta_id: item.ofertaId,
            cantidad: item.quantity,
          })),
        };

    return this.http.post<unknown>(this.apiUrl, body).pipe(
      map((response) => adaptOrderResponse(response, 0)),
      catchError((error) => this.toError(error, 'No se pudo procesar la orden.')),
    );
  }

  /** Historial de órdenes del comprador (`GET /orders`). */
  getOrders(): Observable<OrderResponse[]> {
    if (this.isMock()) {
      return of([]).pipe(delay(200));
    }

    if (!environment.apiUrl) {
      return this.missingApiUrl();
    }

    return this.http.get<unknown>(this.apiUrl).pipe(
      map((response) => adaptOrderListFromBackend(response)),
      catchError((error) => this.toError(error, 'No se pudieron cargar tus pedidos.')),
    );
  }

  /** Detalle de una orden (`GET /orders/:id`). */
  getOrder(id: string): Observable<OrderResponse> {
    if (this.isMock()) {
      return of(generateMockOrderResponse(0)).pipe(delay(200));
    }

    if (!environment.apiUrl) {
      return this.missingApiUrl();
    }

    return this.http.get<unknown>(`${this.apiUrl}/${id}`).pipe(
      map((response) => adaptOrderResponse(response, 0)),
      catchError((error) => this.toError(error, 'No se pudo cargar el pedido.')),
    );
  }

  /** Timeline de eventos (`GET /orders/:id/timeline`). */
  getTimeline(id: string): Observable<OrderTimelineEvent[]> {
    if (this.isMock()) {
      return of([]).pipe(delay(200));
    }

    if (!environment.apiUrl) {
      return this.missingApiUrl();
    }

    return this.http.get<unknown>(`${this.apiUrl}/${id}/timeline`).pipe(
      map((response) => adaptOrderTimelineFromBackend(response)),
      catchError((error) => this.toError(error, 'No se pudo cargar el historial del pedido.')),
    );
  }

  private mockOrderSuccess(_payload: CreateOrderPayload): Observable<OrderResponse> {
    return of(generateMockOrderResponse(0)).pipe(delay(800));
  }

  private isMock(): boolean {
    return environment.apiConfig?.dataSource === 'mock';
  }

  /** Traduce el error del backend a un mensaje de dominio (`R-AR-9`, `R-UX-4`). */
  private toError(error: unknown, fallback: string): Observable<never> {
    return throwError(() => new Error(toUserMessage(error, fallback)));
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
