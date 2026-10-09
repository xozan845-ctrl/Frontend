import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { toUserMessage } from '../../../core/models/api-error';
import { Store } from '../../products/public-api';
import { OfferDraft, StoreDraft } from '../models/store-wizard.model';
import { StoreRepository } from '../repositories/store.repository';
import { adaptStoreFromBackend } from '../adapters/store.adapter';

const MOCK_STORE: Store = {
  id: 'tienda-demo',
  vendorId: 'vendedor-demo',
  name: 'Mi Tienda',
  description: 'Tienda creada en modo demo.',
};

@Injectable({
  providedIn: 'root',
})
export class StoreService implements StoreRepository {
  private readonly http = inject(HttpClient);
  private readonly vendorEndpoint = environment.apiConfig.endpoints.vendor;

  createStore(draft: StoreDraft): Observable<Store> {
    if (this.isMock()) return of(MOCK_STORE).pipe(delay(400));
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(`${environment.apiUrl}${this.vendorEndpoint}/tienda`, {
        nombre: draft.name,
        descripcion: draft.description,
      })
      .pipe(
        map((response) => adaptStoreFromBackend(response)),
        map((store) => {
          if (!store) throw new Error('No se pudo interpretar la tienda creada.');
          return store;
        }),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo crear la tienda.'))),
        ),
      );
  }

  getMyStore(): Observable<Store | null> {
    if (this.isMock()) return of(MOCK_STORE).pipe(delay(200));
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(`${environment.apiUrl}${this.vendorEndpoint}/me/tienda`).pipe(
      map((response) => adaptStoreFromBackend(response)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) return of<Store | null>(null);
        return throwError(() => new Error(toUserMessage(error, 'No se pudo cargar tu tienda.')));
      }),
    );
  }

  publishOffer(offer: OfferDraft): Observable<void> {
    if (this.isMock()) return of(undefined).pipe(delay(200));
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(`${environment.apiUrl}${this.vendorEndpoint}/productos`, {
        producto_id: offer.productId,
        margen: offer.margin,
      })
      .pipe(
        map(() => undefined),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo publicar el producto.'))),
        ),
      );
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
