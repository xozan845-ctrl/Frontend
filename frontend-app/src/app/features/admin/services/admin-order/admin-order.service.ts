import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { toUserMessage } from '../../../../core/models/api-error';
import {
  adaptOrderListFromBackend,
  adaptOrderResponse,
  adaptOrderTimelineFromBackend,
} from '../../../cart/public-api';
import type {
  OrderResponse,
  OrderStatusUpdate,
  OrderTimelineEvent,
} from '../../../cart/public-api';
import { AdminOrderRepository } from '../../repositories/admin-order.repository';

/** Órdenes globales de administración (`/orders/admin`, `/orders/:id`). */
@Injectable({
  providedIn: 'root',
})
export class AdminOrderService implements AdminOrderRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}${environment.apiConfig.endpoints.orders}`;

  listAll(status?: string, limit?: number): Observable<OrderResponse[]> {
    if (!environment.apiUrl) return this.missingApiUrl();

    const params: Record<string, string | number> = {};
    if (status) params['estado'] = status;
    if (limit) params['limite'] = limit;

    return this.http.get<unknown>(`${this.apiUrl}/admin/todas`, { params }).pipe(
      map((response) => adaptOrderListFromBackend(response)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudieron cargar las órdenes.'))),
      ),
    );
  }

  getOrder(id: string): Observable<OrderResponse> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(`${this.apiUrl}/${encodeURIComponent(id)}`).pipe(
      map((response) => adaptOrderResponse(response, 0)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo cargar la orden.'))),
      ),
    );
  }

  getTimeline(id: string): Observable<OrderTimelineEvent[]> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(`${this.apiUrl}/${encodeURIComponent(id)}/timeline`).pipe(
      map((response) => adaptOrderTimelineFromBackend(response)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo cargar el timeline.'))),
      ),
    );
  }

  advanceStatus(id: string, status: string, reason?: string): Observable<OrderStatusUpdate> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .patch<unknown>(`${this.apiUrl}/${encodeURIComponent(id)}/estado`, {
        estado: status,
        motivo: reason,
      })
      .pipe(
        map((response) => {
          const data = (response ?? {}) as Record<string, unknown>;
          return { id: String(data['id'] ?? id), status: String(data['estado'] ?? status) };
        }),
        catchError((error: unknown) =>
          throwError(
            () => new Error(toUserMessage(error, 'No se pudo actualizar el estado de la orden.')),
          ),
        ),
      );
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
