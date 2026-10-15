import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, defer, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { toUserMessage } from '../../../core/models/api-error';
import { adaptClientFromBackend, adaptClientsFromBackend } from '../adapters/vendor.adapter';
import { VENDOR_MOCK_DELAY_MS } from '../constants/vendor.constants';
import { MOCK_CLIENTS } from '../mocks/vendor.mocks';
import { Client, CreateClientPayload } from '../models/vendor-order.model';
import { ClientRepository } from '../repositories/client.repository';

/** Minúsculas sin acentos para que el buscador del POS sea tolerante. */
function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Cartera de clientes del vendedor (`GET/POST /vendedores/clientes`, contrato
 * asumido ADR-20). Respuestas normalizadas con el adapter tolerante (`R-C-3`)
 * y modo `mock` para operar el POS sin backend (`R-EN-2`).
 */
@Injectable({
  providedIn: 'root',
})
export class ClientService implements ClientRepository {
  private readonly http = inject(HttpClient);
  private readonly vendorEndpoint = environment.apiConfig.endpoints.vendor;

  /** Clientes demo mutables de la sesión (modo `mock`). */
  private readonly mockClients: Client[] = MOCK_CLIENTS.map((client) => ({ ...client }));
  private mockClientSeq = 125;

  searchClients(query: string): Observable<Client[]> {
    if (this.isMock()) {
      return of(this.filterMockClients(query)).pipe(delay(VENDOR_MOCK_DELAY_MS));
    }
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
    if (this.isMock()) {
      return defer(() => {
        const sequence = ++this.mockClientSeq;
        const client: Client = {
          id: `vc-${sequence}`,
          code: `CL-${String(sequence).padStart(5, '0')}`,
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
        };
        this.mockClients.unshift(client);
        return of({ ...client }).pipe(delay(VENDOR_MOCK_DELAY_MS));
      });
    }
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

  private filterMockClients(query: string): Client[] {
    const needle = normalizeText(query);
    return this.mockClients
      .filter(
        (client) =>
          !needle ||
          [client.name, client.code, client.phone, client.email].some((field) =>
            normalizeText(field).includes(needle),
          ),
      )
      .map((client) => ({ ...client }));
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
