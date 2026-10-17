import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { toUserMessage } from '../../../core/models/api-error';
import { adaptVendorProductsFromBackend } from '../adapters/vendor.adapter';
import { VendorProduct } from '../models/vendor-order.model';
import { VendorProductRepository } from '../repositories/vendor-product.repository';

/**
 * Catálogo propio del vendedor (`GET /vendedores/me/productos`, contrato asumido
 * ADR-20). Respuestas normalizadas con el adapter tolerante (`R-C-3`).
 */
@Injectable({
  providedIn: 'root',
})
export class VendorProductService implements VendorProductRepository {
  private readonly http = inject(HttpClient);
  private readonly vendorEndpoint = environment.apiConfig.endpoints.vendor;

  listVendorProducts(): Observable<VendorProduct[]> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(`${environment.apiUrl}${this.vendorEndpoint}/me/productos`).pipe(
      map((response) => adaptVendorProductsFromBackend(response)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo cargar tu catálogo.'))),
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
