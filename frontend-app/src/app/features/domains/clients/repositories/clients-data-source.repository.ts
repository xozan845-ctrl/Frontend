import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import type { ClientOrder } from '../models/client.model';

/**
 * Fuente de órdenes de la cartera de clientes. Cada workspace (empresa o
 * vendedor) provee su propia implementación y su clave de storage.
 */
export interface ClientsDataSource {
  /** Órdenes visibles para el ámbito activo. */
  orders(): Observable<ClientOrder[]>;
  /** Clave de `localStorage` aislada por empresa o vendedor. */
  storageKey(): string;
}

export const CLIENTS_DATA_SOURCE = new InjectionToken<ClientsDataSource>('ClientsDataSource');
