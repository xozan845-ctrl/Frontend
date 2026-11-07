import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { Store } from '../models/store.model';

/** Storefront de una tienda: su identidad y sus ofertas (como `Product`). */
export interface Storefront {
  store: Store | null;
  products: Product[];
}

export interface ProductRepository {
  /**
   * Carga la tienda `storeId` y sus ofertas. El backend es multi-tienda: la
   * tienda se resuelve por URL, no por configuración estática.
   */
  getStorefront(storeId: string): Observable<Storefront>;
}

export const PRODUCT_REPOSITORY = new InjectionToken<ProductRepository>('ProductRepository');
