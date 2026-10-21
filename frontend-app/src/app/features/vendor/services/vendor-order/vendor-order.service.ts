import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { toUserMessage } from '../../../../core/models/api-error';
import {
  adaptOrderFromBackend,
  adaptOrdersFromBackend,
} from '../../adapters/vendor/vendor.adapter';
import { CreateOrderPayload, OrderStatus, VendorOrder } from '../../models/vendor-order.model';
import { VendorOrderRepository } from '../../repositories/vendor-order.repository';

/**
 * Pedidos del vendedor (`GET/POST /vendedores/pedidos`, `PATCH .../:id/estado`).
 * El contrato real del backend no existe aún (ADR-20): las respuestas se
 * normalizan con los adapters tolerantes (`R-C-3`).
 */
@Injectable({
  providedIn: 'root',
})
export class VendorOrderService implements VendorOrderRepository {
  private readonly http = inject(HttpClient);
  private readonly vendorEndpoint = environment.apiConfig.endpoints.vendor;

  listOrders(): Observable<VendorOrder[]> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(`${environment.apiUrl}${this.vendorEndpoint}/pedidos`).pipe(
      map((response) => adaptOrdersFromBackend(response)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudieron cargar los pedidos.'))),
      ),
    );
  }

  getOrder(id: string): Observable<VendorOrder> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .get<unknown>(`${environment.apiUrl}${this.vendorEndpoint}/pedidos/${encodeURIComponent(id)}`)
      .pipe(
        map((response) => adaptOrderFromBackend(response)),
        map((order) => {
          if (!order) throw new Error('No se pudo interpretar el pedido.');
          return order;
        }),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo cargar el pedido.'))),
        ),
      );
  }

  createOrder(payload: CreateOrderPayload): Observable<VendorOrder> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(`${environment.apiUrl}${this.vendorEndpoint}/pedidos`, {
        cliente_id: payload.clientId,
        tienda_id: payload.storeId,
        fecha: payload.date,
        metodo_entrega: payload.deliveryMethod,
        descuento: payload.discountPercent,
        observaciones: payload.observations,
        items: payload.items.map((item) => ({
          producto_id: item.productId,
          cantidad: item.quantity,
        })),
      })
      .pipe(
        map((response) => adaptOrderFromBackend(response)),
        map((order) => {
          if (!order) throw new Error('No se pudo interpretar el pedido registrado.');
          return order;
        }),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo registrar el pedido.'))),
        ),
      );
  }

  updateStatus(id: string, status: OrderStatus): Observable<VendorOrder> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .patch<unknown>(
        `${environment.apiUrl}${this.vendorEndpoint}/pedidos/${encodeURIComponent(id)}/estado`,
        { estado: status },
      )
      .pipe(
        map((response) => adaptOrderFromBackend(response)),
        map((order) => {
          if (!order) throw new Error('No se pudo interpretar el pedido actualizado.');
          return order;
        }),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo actualizar el pedido.'))),
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
