import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { toUserMessage } from '../../../../../core/models/api-error';
import {
  adaptVendorOfferFromBackend,
  adaptVendorOfferPageFromBackend,
} from '../../adapters/vendor/vendor.adapter';
import { VendorOffer, VendorOfferPage } from '../../models/vendor-offer.model';
import { VendorOfferRepository } from '../../repositories/vendor-offer.repository';

/**
 * Ofertas del vendedor (`GET /vendedores/me/ofertas`,
 * `PATCH /vendedores/productos/:id`). Normaliza con el adapter tolerante
 * (`R-C-3`) y traduce los errores del backend (`R-AR-9`).
 */
@Injectable({
  providedIn: 'root',
})
export class VendorOfferService implements VendorOfferRepository {
  private readonly http = inject(HttpClient);
  private readonly vendorEndpoint = environment.apiConfig.endpoints.vendor;

  listOffers(page: number, limit: number): Observable<VendorOfferPage> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .get<unknown>(`${environment.apiUrl}${this.vendorEndpoint}/me/ofertas`, {
        params: { pagina: page, limite: limit },
      })
      .pipe(
        map((response) => adaptVendorOfferPageFromBackend(response)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudieron cargar tus ofertas.'))),
        ),
      );
  }

  updateMargin(offerId: string, margin: number): Observable<VendorOffer> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .patch<unknown>(
        `${environment.apiUrl}${this.vendorEndpoint}/productos/${encodeURIComponent(offerId)}`,
        { margen: margin },
      )
      .pipe(
        map((response) => adaptVendorOfferFromBackend(response)),
        map((offer) => {
          if (!offer) throw new Error('No se pudo interpretar la oferta actualizada.');
          return offer;
        }),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo actualizar el margen.'))),
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
