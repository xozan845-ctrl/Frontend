import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

export interface ProductRepository {
  getProducts(): Observable<Product[]>;
  getProductById(id: string | number): Observable<Product>;
  getCategories(): Observable<string[]>;
}

export const PRODUCT_REPOSITORY = new InjectionToken<ProductRepository>('ProductRepository');
