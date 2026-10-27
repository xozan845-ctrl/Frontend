import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Puertos que un workspace ofrece al store compartido de pedidos. Solo
 * `list` es obligatorio: los paneles de solo lectura no implementan detalle
 * ni cambio de estado (modelo de capacidades, ADR-62).
 */
export interface OrdersDataSource<T extends { id: string }, S extends string = string> {
  list(): Observable<T[]>;
  detail?(id: string): Observable<T>;
  updateStatus?(id: string, status: S): Observable<T>;
}

/**
 * Crea el token de la fuente de pedidos de un workspace. Cada panel declara el
 * suyo para que el store compartido reciba su tipo de vista y su estado.
 */
export function createOrdersDataSourceToken<T extends { id: string }, S extends string = string>(
  description: string,
): InjectionToken<OrdersDataSource<T, S>> {
  return new InjectionToken<OrdersDataSource<T, S>>(description);
}
