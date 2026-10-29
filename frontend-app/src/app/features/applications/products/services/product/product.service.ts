import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { toUserMessage } from '../../../../../core/models/api-error';
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
   * Las ofertas traen la identidad comercial real (precio, stock, imagen y
   * atributos). Se enriquecen con el catálogo de la empresa solo para los
   * campos descriptivos que el contrato de ofertas no replica. El enrichment
   * es best-effort: la tienda sigue cargando aunque falle esa segunda lectura.
   */
  getStorefront(storeId: string): Observable<Storefront> {
    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http
      .get<unknown>(
        `${environment.apiUrl}${this.storefrontEndpoint}/${encodeURIComponent(storeId)}`,
      )
      .pipe(
        switchMap((storefront) => {
          const companyId = this.readCompanyId(storefront);
          const params: Record<string, string | number> = { limite: 100 };
          if (companyId) params['empresa_id'] = companyId;

          return this.http
            .get<unknown>(`${environment.apiUrl}${this.catalogEndpoint}`, { params })
            .pipe(
              catchError(() => of(null)),
              map((catalog) => adaptStorefrontFromBackend(storefront, catalog, environment.apiUrl)),
            );
        }),
        catchError((error) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo cargar la tienda.'))),
        ),
      );
  }

  private readCompanyId(response: unknown): string | null {
    if (!response || typeof response !== 'object') return null;
    const storefront = response as {
      tienda?: { empresa_id?: string | null; empresaId?: string | null };
    };
    const companyId = storefront.tienda?.empresa_id ?? storefront.tienda?.empresaId;
    return typeof companyId === 'string' && companyId.trim() ? companyId : null;
  }
}
