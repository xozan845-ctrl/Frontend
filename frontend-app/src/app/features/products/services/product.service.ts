import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Product } from '../models/product.model';
import { MOCK_PRODUCTS } from '../mocks/product.mock';
import {
  adaptProductListFromBackend,
  adaptSingleProductFromBackend,
} from '../adapters/product.adapter';
import { unwrapApiListResponse } from '../../../shared/models/api-response.dto';

import { ProductRepository } from '../repositories/product.repository';

@Injectable({
  providedIn: 'root',
})
export class ProductService implements ProductRepository {
  private readonly http = inject(HttpClient);
  private readonly endpoint = environment.apiConfig?.endpoints?.products || '/products';
  private readonly categoriesEndpoint =
    environment.apiConfig?.endpoints?.categories || '/categories';
  private readonly apiUrl = `${environment.apiUrl}${this.endpoint}`;

  getProducts(): Observable<Product[]> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return of(MOCK_PRODUCTS);
    }

    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http
      .get<unknown>(this.apiUrl)
      .pipe(map((response) => adaptProductListFromBackend(response)));
  }

  getProductById(id: string | number): Observable<Product> {
    if (environment.apiConfig?.dataSource === 'mock') {
      const found = MOCK_PRODUCTS.find((p) => String(p.id) === String(id));
      if (found) return of(found);
      return of(MOCK_PRODUCTS[0]);
    }

    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http
      .get<unknown>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => adaptSingleProductFromBackend(response)));
  }

  /**
   * Obtiene categorías de forma dinámica.
   * Si el backend tiene un endpoint de categorías lo consulta; si no,
   * se pueden extraer automáticamente de los productos cargados.
   */
  getCategories(): Observable<string[]> {
    if (environment.apiConfig?.dataSource === 'mock') {
      const unique = Array.from(new Set(MOCK_PRODUCTS.map((p) => p.category)));
      return of(unique);
    }

    if (!environment.apiUrl) {
      return throwError(
        () =>
          new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
      );
    }

    return this.http.get<unknown>(`${environment.apiUrl}${this.categoriesEndpoint}`).pipe(
      map((response) => {
        const list = unwrapApiListResponse<string | { name?: string; title?: string }>(response);
        return list.map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') return item.name || item.title || 'General';
          return 'General';
        });
      }),
      catchError(() => {
        return this.getProducts().pipe(
          map((products) => Array.from(new Set(products.map((p) => p.category)))),
        );
      }),
    );
  }
}
