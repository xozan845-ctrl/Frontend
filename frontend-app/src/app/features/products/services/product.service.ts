import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
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

  /**
   * Storefront de una tienda: `GET /tiendas/:storeId` → `{ tienda, ofertas }`.
   * La tienda llega por URL (multi-tienda); no se fija en configuración.
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

    return this.http
      .get<unknown>(`${environment.apiUrl}${this.storefrontEndpoint}/${storeId}`)
      .pipe(map((response) => adaptStorefrontFromBackend(response)));
  }
}
