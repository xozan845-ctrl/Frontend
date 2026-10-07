import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Product } from '../models/product.model';
import { MOCK_PRODUCTS } from '../mocks/product.mock';
import {
  adaptProductListFromBackend,
  adaptSingleProductFromBackend,
} from '../adapters/product.adapter';

import { ProductRepository } from '../repositories/product.repository';

@Injectable({
  providedIn: 'root',
})
export class ProductService implements ProductRepository {
  private readonly http = inject(HttpClient);
  private readonly endpoint = environment.apiConfig?.endpoints?.products || '/catalog/productos';
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
   * Categorías derivadas del catálogo: Core Engine no expone un endpoint de
   * categorías, así que se extraen de los productos cargados.
   */
  getCategories(): Observable<string[]> {
    return this.getProducts().pipe(
      map((products) => Array.from(new Set(products.map((p) => p.category).filter(Boolean)))),
    );
  }
}
