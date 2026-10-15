import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, defer, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { toUserMessage } from '../../../core/models/api-error';
import { adaptOrderFromBackend, adaptOrdersFromBackend } from '../adapters/vendor.adapter';
import { VENDOR_MOCK_DELAY_MS, VENDOR_TAX_RATE } from '../constants/vendor.constants';
import { buildMockVendorOrders, MOCK_CLIENTS, MOCK_VENDOR_PRODUCTS } from '../mocks/vendor.mocks';
import { CreateOrderPayload, OrderStatus, VendorOrder } from '../models/vendor-order.model';
import { VendorOrderRepository } from '../repositories/vendor-order.repository';

/** Descuento 0–100 saneado (los bordes numéricos vienen del formulario del POS). */
function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/**
 * Pedidos del vendedor (`GET/POST /vendedores/pedidos`, `PATCH .../:id/estado`).
 * El contrato real del backend no existe aún (ADR-20): las respuestas se
 * normalizan con los adapters tolerantes (`R-C-3`) y el modo `mock` permite
 * trabajar el POS completo sin backend (`R-EN-2`).
 */
@Injectable({
  providedIn: 'root',
})
export class VendorOrderService implements VendorOrderRepository {
  private readonly http = inject(HttpClient);
  private readonly vendorEndpoint = environment.apiConfig.endpoints.vendor;

  /** Pedidos demo mutables de la sesión (modo `mock`); cada TestBed recibe los suyos. */
  private readonly mockOrders = buildMockVendorOrders();

  listOrders(): Observable<VendorOrder[]> {
    if (this.isMock()) {
      return of(this.mockOrders.map((order) => ({ ...order }))).pipe(delay(VENDOR_MOCK_DELAY_MS));
    }
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(`${environment.apiUrl}${this.vendorEndpoint}/pedidos`).pipe(
      map((response) => adaptOrdersFromBackend(response)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudieron cargar los pedidos.'))),
      ),
    );
  }

  getOrder(id: string): Observable<VendorOrder> {
    if (this.isMock()) {
      return defer(() => {
        const order = this.mockOrders.find((candidate) => candidate.id === id);
        if (!order) return throwError(() => new Error('No se encontró el pedido.'));
        return of({ ...order }).pipe(delay(VENDOR_MOCK_DELAY_MS));
      });
    }
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
    if (this.isMock()) {
      return defer(() => {
        const order = this.buildMockOrder(payload);
        this.mockOrders.unshift(order);
        return of({ ...order }).pipe(delay(VENDOR_MOCK_DELAY_MS));
      });
    }
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
    if (this.isMock()) {
      return defer(() => {
        const order = this.mockOrders.find((candidate) => candidate.id === id);
        if (!order) return throwError(() => new Error('No se encontró el pedido.'));
        order.status = status;
        return of({ ...order }).pipe(delay(VENDOR_MOCK_DELAY_MS));
      });
    }
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

  /** Construye el pedido del modo `mock` con los precios del catálogo demo. */
  private buildMockOrder(payload: CreateOrderPayload): VendorOrder {
    const client = MOCK_CLIENTS.find((candidate) => candidate.id === payload.clientId) ?? null;
    const lines = payload.items.map((item) => {
      const product = MOCK_VENDOR_PRODUCTS.find((candidate) => candidate.id === item.productId);
      return {
        productId: item.productId,
        name: product?.name ?? 'Producto',
        sku: product?.sku ?? '',
        unitPrice: product?.price ?? 0,
        quantity: item.quantity,
      };
    });

    const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const discount = (subtotal * clampPercent(payload.discountPercent)) / 100;
    const total = Math.round((subtotal - discount) * (1 + VENDOR_TAX_RATE) * 100) / 100;

    return {
      id: this.nextMockOrderId(),
      clientId: client?.id ?? null,
      clientName: client?.name ?? 'Cliente ocasional',
      createdAt: new Date().toISOString(),
      status: 'pendiente',
      total,
      lines,
      notes: payload.observations,
    };
  }

  private nextMockOrderId(): string {
    const max = this.mockOrders.reduce((acc, order) => {
      const numeric = Number(order.id.replace(/\D/g, ''));
      return Number.isFinite(numeric) ? Math.max(acc, numeric) : acc;
    }, 0);
    return `PED-${String(max + 1).padStart(6, '0')}`;
  }

  private isMock(): boolean {
    return environment.apiConfig?.dataSource === 'mock';
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
