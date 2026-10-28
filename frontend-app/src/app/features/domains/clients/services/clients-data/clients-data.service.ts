import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { toUserMessage } from '../../../../../core/models/api-error';
import { CLIENTS_SCOPE_CONFIG } from '../../../../../shared/clients/constants/clients-config.tokens';
import type { ClientsScopeConfig } from '../../../../../shared/clients/models/clients-config.model';
import { adaptClientOrdersFromBackend } from '../../adapters/clients/client.adapter';
import { clientsStorageKey } from '../../constants/clients.constants';
import type { ClientOrder } from '../../models/client.model';
import type { ClientsDataSource } from '../../repositories/clients-data-source.repository';
import { AuthStore } from '../../../../applications/auth/public-api';

/**
 * Fuente de datos HTTP de la cartera compartida. El workspace configura el
 * endpoint de órdenes y el ámbito del storage; la lógica de clientes es común.
 */
@Injectable()
export class ClientsHttpDataSource implements ClientsDataSource {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ClientsScopeConfig>(CLIENTS_SCOPE_CONFIG);
  private readonly auth = inject(AuthStore);

  orders(): Observable<ClientOrder[]> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .get<unknown>(
        `${environment.apiUrl}${environment.apiConfig.endpoints.orders}${this.config.ordersPath}`,
      )
      .pipe(
        map((response) => adaptClientOrdersFromBackend(response)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudieron cargar los clientes.'))),
        ),
      );
  }

  storageKey(): string {
    const id = this.config.scope === 'company' ? this.auth.user()?.tenantId : this.auth.user()?.id;
    return clientsStorageKey(this.config.scope, id);
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
