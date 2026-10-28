import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { toUserMessage } from '../../../../../core/models/api-error';
import {
  adaptClientFromBackend,
  adaptClientsFromBackend,
} from '../../adapters/vendor/vendor.adapter';
import { Client, CreateClientPayload } from '../../models/vendor-order.model';
import { ClientRepository } from '../../repositories/client.repository';

/**
 * Cartera de clientes del vendedor (`GET/POST /vendedores/clientes`, contrato
 * asumido ADR-20). Respuestas normalizadas con el adapter tolerante (`R-C-3`).
 */
@Injectable({
  providedIn: 'root',
})
export class ClientService implements ClientRepository {
  private readonly http = inject(HttpClient);
  private readonly vendorEndpoint = environment.apiConfig.endpoints.vendor;

  searchClients(query: string): Observable<Client[]> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .get<unknown>(`${environment.apiUrl}${this.vendorEndpoint}/clientes`, {
        params: { q: query },
      })
      .pipe(
        map((response) => adaptClientsFromBackend(response)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudieron cargar los clientes.'))),
        ),
      );
  }

  createClient(payload: CreateClientPayload): Observable<Client> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(`${environment.apiUrl}${this.vendorEndpoint}/clientes`, {
        nombre: payload.name,
        telefono: payload.phone,
        email: payload.email,
      })
      .pipe(
        map((response) => adaptClientFromBackend(response)),
        map((client) => {
          if (!client) throw new Error('No se pudo interpretar el cliente creado.');
          return client;
        }),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo crear el cliente.'))),
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
