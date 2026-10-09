import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { toUserMessage } from '../../../core/models/api-error';
import { CartItem } from '../models/cart.model';
import { CartRepository } from '../repositories/cart.repository';
import { adaptCartFromBackend } from '../adapters/cart.adapter';

interface MockItem {
  ofertaId: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService implements CartRepository {
  private readonly http = inject(HttpClient);
  private readonly cartEndpoint = environment.apiConfig.endpoints.cart;
  private readonly apiUrl = `${environment.apiUrl}${this.cartEndpoint}`;

  /** Carrito simulado para `dataSource: 'mock'` (E2E hermético). */
  private mockItems: MockItem[] = [];

  getCart(): Observable<CartItem[]> {
    if (this.isMock()) {
      return this.mockResponse();
    }
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(this.apiUrl).pipe(
      map(adaptCartFromBackend),
      catchError((error) => this.toError(error)),
    );
  }

  addItem(ofertaId: string, quantity: number): Observable<CartItem[]> {
    if (this.isMock()) {
      const existing = this.mockItems.find((item) => item.ofertaId === ofertaId);
      if (existing) {
        existing.quantity = Math.min(99, existing.quantity + quantity);
      } else {
        this.mockItems.push({ ofertaId, quantity });
      }
      return this.mockResponse();
    }
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(`${this.apiUrl}/items`, { oferta_id: ofertaId, cantidad: quantity })
      .pipe(
        map(adaptCartFromBackend),
        catchError((error) => this.toError(error)),
      );
  }

  updateQuantity(ofertaId: string, quantity: number): Observable<CartItem[]> {
    if (this.isMock()) {
      this.mockItems = this.mockItems
        .map((item) => (item.ofertaId === ofertaId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0);
      return this.mockResponse();
    }
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .patch<unknown>(`${this.apiUrl}/items/${ofertaId}`, { cantidad: quantity })
      .pipe(
        map(adaptCartFromBackend),
        catchError((error) => this.toError(error)),
      );
  }

  removeItem(ofertaId: string): Observable<CartItem[]> {
    if (this.isMock()) {
      this.mockItems = this.mockItems.filter((item) => item.ofertaId !== ofertaId);
      return this.mockResponse();
    }
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.delete<unknown>(`${this.apiUrl}/items/${ofertaId}`).pipe(
      map(adaptCartFromBackend),
      catchError((error) => this.toError(error)),
    );
  }

  clearCart(): Observable<CartItem[]> {
    if (this.isMock()) {
      this.mockItems = [];
      return this.mockResponse();
    }
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.delete<unknown>(this.apiUrl).pipe(
      map(adaptCartFromBackend),
      catchError((error) => this.toError(error)),
    );
  }

  /** Vista simulada con la misma forma que el backend (`{ items }`). */
  private mockResponse(): Observable<CartItem[]> {
    const response = {
      items: this.mockItems.map((item) => ({
        oferta_id: item.ofertaId,
        cantidad: item.quantity,
        producto_nombre: 'Producto',
        precio_venta: 0,
        stock: 0,
      })),
    };
    return of(adaptCartFromBackend(response)).pipe(delay(150));
  }

  private isMock(): boolean {
    return environment.apiConfig?.dataSource === 'mock';
  }

  /** Traduce el error del backend a un mensaje de dominio (`R-AR-9`, `R-UX-4`). */
  private toError(error: unknown): Observable<never> {
    return throwError(() => new Error(toUserMessage(error, 'No se pudo actualizar el carrito.')));
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
