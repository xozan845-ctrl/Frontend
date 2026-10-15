import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Client, CreateClientPayload } from '../models/vendor-order.model';

/** Puerto de clientes del vendedor (Core Engine, contrato asumido ADR-20). */
export interface ClientRepository {
  /** Busca por nombre, código, teléfono o correo (`GET /vendedores/clientes?q=`). */
  searchClients(query: string): Observable<Client[]>;
  /** Da de alta un cliente (`POST /vendedores/clientes`). */
  createClient(payload: CreateClientPayload): Observable<Client>;
}

export const CLIENT_REPOSITORY = new InjectionToken<ClientRepository>('ClientRepository');
