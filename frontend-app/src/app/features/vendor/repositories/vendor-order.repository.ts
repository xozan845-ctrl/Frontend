import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateOrderPayload, OrderStatus, VendorOrder } from '../models/vendor-order.model';

/** Puerto de pedidos del vendedor (Core Engine, contrato asumido ADR-20). */
export interface VendorOrderRepository {
  /** Pedidos del vendedor autenticado (`GET /vendedores/pedidos`). */
  listOrders(): Observable<VendorOrder[]>;
  /** Detalle de un pedido (`GET /vendedores/pedidos/:id`). */
  getOrder(id: string): Observable<VendorOrder>;
  /** Registra un pedido desde el POS (`POST /vendedores/pedidos`). */
  createOrder(payload: CreateOrderPayload): Observable<VendorOrder>;
  /** Cambia el estado de un pedido (`PATCH /vendedores/pedidos/:id/estado`). */
  updateStatus(id: string, status: OrderStatus): Observable<VendorOrder>;
}

export const VENDOR_ORDER_REPOSITORY = new InjectionToken<VendorOrderRepository>(
  'VendorOrderRepository',
);
