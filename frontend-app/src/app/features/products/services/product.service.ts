import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { MOCK_PRODUCTS, MOCK_STORE } from '../mocks/product.mock';
import { adaptStorefrontFromBackend } from '../adapters/product.adapter';
import { ProductRepository, Storefront } from '../repositories/product.repository';

@Injectable({
  providedIn: 'root',
})
export class ProductService implements ProductRepository {
  private readonly http = inject(HttpClient);
  private readonly storefrontEndpoint = environment.apiConfig?.endpoints?.storefront || '/tiendas';
  private readonly catalogEndpoint =
    environment.apiConfig?.endpoints?.products || '/catalog/productos';

  /**
   * Storefront de una tienda: `GET /tiendas/:storeId` → `{ tienda, ofertas }`.
   * La tienda llega por URL (multi-tienda); no se fija en configuración.
   *
   * Las ofertas no traen descripción/categoría, así que se enriquecen con el
   * catálogo público (`GET /catalog/productos`), en una sola petición y de
   * forma **best-effort**: si el catálogo falla, el storefront sigue cargando.
   */
  getStorefront(storeId: string): Observable<Storefront> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return of({ store: MOCK_STORE, products: MOCK_PRODUCTS });
    }

    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    const storefront$ = this.http.get<unknown>(
      `${environment.apiUrl}${this.storefrontEndpoint}/${storeId}`,
    );
    const catalog$ = this.http
      .get<unknown>(`${environment.apiUrl}${this.catalogEndpoint}`)
      .pipe(catchError(() => of(null)));

    return forkJoin({ storefront: storefront$, catalog: catalog$ }).pipe(
      map(({ storefront, catalog }) => adaptStorefrontFromBackend(storefront, catalog)),
    );
  }
}
