import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Store } from '../../products/public-api';
import { CatalogProductOption, OfferDraft, StoreDraft } from '../models/store-wizard.model';
import { StoreRepository } from '../repositories/store.repository';
import { adaptCatalogOptionsFromBackend, adaptStoreFromBackend } from '../adapters/store.adapter';

const MOCK_STORE: Store = {
  id: 'tienda-demo',
  vendorId: 'vendedor-demo',
  name: 'Mi Tienda',
  description: 'Tienda creada en modo demo.',
};

const MOCK_CATALOG: CatalogProductOption[] = [
  { id: 'p-demo-1', name: 'Teclado Mecánico', sku: 'SKU-TEC' },
  { id: 'p-demo-2', name: 'Mouse Gamer', sku: 'SKU-MOU' },
];

@Injectable({
  providedIn: 'root',
})
export class StoreService implements StoreRepository {
  private readonly http = inject(HttpClient);
  private readonly vendorEndpoint = environment.apiConfig?.endpoints?.vendor || '/vendedores';
  private readonly catalogEndpoint =
    environment.apiConfig?.endpoints?.products || '/catalog/productos';

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
      );
  }

  getMyStore(): Observable<Store | null> {
    if (this.isMock()) return of(MOCK_STORE).pipe(delay(200));
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(`${environment.apiUrl}${this.vendorEndpoint}/me/tienda`).pipe(
      map((response) => adaptStoreFromBackend(response)),
      catchError((error: HttpErrorResponse) =>
        error.status === 404 ? of<Store | null>(null) : throwError(() => error),
      ),
    );
  }

  listCatalog(): Observable<CatalogProductOption[]> {
    if (this.isMock()) return of(MOCK_CATALOG).pipe(delay(300));
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .get<unknown>(`${environment.apiUrl}${this.catalogEndpoint}`)
      .pipe(map((response) => adaptCatalogOptionsFromBackend(response)));
  }

  publishOffer(offer: OfferDraft): Observable<void> {
    if (this.isMock()) return of(undefined).pipe(delay(200));
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(`${environment.apiUrl}${this.vendorEndpoint}/productos`, {
        producto_id: offer.productId,
        margen: offer.margin,
      })
      .pipe(map(() => undefined));
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
