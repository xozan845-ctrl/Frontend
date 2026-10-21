import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { toUserMessage } from '../../../../core/models/api-error';
import { adaptStorefrontFromBackend } from '../../adapters/product/product.adapter';
import { ProductRepository, Storefront } from '../../repositories/product.repository';

@Injectable({
  providedIn: 'root',
})
export class ProductService implements ProductRepository {
  private readonly http = inject(HttpClient);
  private readonly storefrontEndpoint = environment.apiConfig.endpoints.storefront;
  private readonly catalogEndpoint = environment.apiConfig.endpoints.products;

  /**
   * Storefront de una tienda: `GET /tiendas/:storeId` → `{ tienda, ofertas }`.
   * La tienda llega por URL (multi-tienda); no se fija en configuración.
   *
   * Las ofertas no traen descripción/categoría, así que se enriquecen con el
   * catálogo público (`GET /catalog/productos`), en una sola petición y de
   * forma **best-effort**: si el catálogo falla, el storefront sigue cargando.
   */
  getStorefront(storeId: string): Observable<Storefront> {
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
      catchError((error) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo cargar la tienda.'))),
      ),
    );
  }
}
