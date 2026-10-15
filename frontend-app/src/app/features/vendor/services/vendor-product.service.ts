import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { toUserMessage } from '../../../core/models/api-error';
import { adaptVendorProductsFromBackend } from '../adapters/vendor.adapter';
import { VENDOR_MOCK_DELAY_MS } from '../constants/vendor.constants';
import { MOCK_VENDOR_PRODUCTS } from '../mocks/vendor.mocks';
import { VendorProduct } from '../models/vendor-order.model';
import { VendorProductRepository } from '../repositories/vendor-product.repository';

/**
 * Catálogo propio del vendedor (`GET /vendedores/me/productos`, contrato asumido
 * ADR-20). Respuestas normalizadas con el adapter tolerante (`R-C-3`) y modo
 * `mock` con el catálogo demo del POS (`R-EN-2`).
 */
@Injectable({
  providedIn: 'root',
})
export class VendorProductService implements VendorProductRepository {
  private readonly http = inject(HttpClient);
  private readonly vendorEndpoint = environment.apiConfig.endpoints.vendor;

  listVendorProducts(): Observable<VendorProduct[]> {
    if (this.isMock()) {
      return of(MOCK_VENDOR_PRODUCTS.map((product) => ({ ...product }))).pipe(
        delay(VENDOR_MOCK_DELAY_MS),
      );
    }
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(`${environment.apiUrl}${this.vendorEndpoint}/me/productos`).pipe(
      map((response) => adaptVendorProductsFromBackend(response)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo cargar tu catálogo.'))),
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
