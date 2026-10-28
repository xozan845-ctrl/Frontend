import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { toUserMessage } from '../../../../../core/models/api-error';
import type { OrderResponse } from '../../../cart/public-api';
import { adaptCompanyOrdersFromBackend } from '../../adapters/company-order/company-order.adapter';
import { adaptCompanySalesAccountFromBackend } from '../../adapters/company-sales/company-sales.adapter';
import { adaptCompanyStoresFromBackend } from '../../adapters/company-store/company-store.adapter';
import { CompanySalesAccount } from '../../models/company-sales.model';
import { CompanyStore } from '../../models/company-store.model';
import {
  CompanyOrderFilters,
  CompanyPortalRepository,
} from '../../repositories/company-portal.repository';

/** Portal de empresa: órdenes, ventas/comisiones y tiendas. */
@Injectable({
  providedIn: 'root',
})
export class CompanyPortalService implements CompanyPortalRepository {
  private readonly http = inject(HttpClient);

  orders(filters: CompanyOrderFilters = {}): Observable<OrderResponse[]> {
    if (!environment.apiUrl) return this.missingApiUrl();

    let params = new HttpParams();
    if (filters.storeId) params = params.set('tiendaId', filters.storeId);
    if (filters.status) params = params.set('estado', filters.status);
    if (filters.limit) params = params.set('limite', String(filters.limit));

    return this.http
      .get<unknown>(`${environment.apiUrl}${environment.apiConfig.endpoints.orders}/empresa`, {
        params,
      })
      .pipe(
        map((response) => adaptCompanyOrdersFromBackend(response)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudieron cargar las ventas.'))),
        ),
      );
  }

  sales(): Observable<CompanySalesAccount> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .get<unknown>(`${environment.apiUrl}${environment.apiConfig.endpoints.companySales}`)
      .pipe(
        map((response) => adaptCompanySalesAccountFromBackend(response)),
        catchError((error: unknown) =>
          throwError(
            () => new Error(toUserMessage(error, 'No se pudo cargar el estado de cuenta.')),
          ),
        ),
      );
  }

  stores(): Observable<CompanyStore[]> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .get<unknown>(`${environment.apiUrl}${environment.apiConfig.endpoints.companyStores}`)
      .pipe(
        map((response) => adaptCompanyStoresFromBackend(response)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudieron cargar las tiendas.'))),
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
