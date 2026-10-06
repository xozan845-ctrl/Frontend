import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CreateOrderPayload, OrderResponse } from '../models/order.model';
import { OrderRepository } from '../repositories/order.repository';
import { adaptOrderResponse, generateMockOrderResponse } from '../adapters/order.adapter';

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
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http
      .post<unknown>(this.apiUrl, payload)
      .pipe(map((response) => adaptOrderResponse(response, payload.total)));
  }

  private mockOrderSuccess(payload: CreateOrderPayload): Observable<OrderResponse> {
    return of(generateMockOrderResponse(payload.total)).pipe(delay(800));
  }
}
