import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '../../products/public-api';
import { CatalogProductOption, OfferDraft, StoreDraft } from '../models/store-wizard.model';

/** Puerto de creación/gestion de la tienda del vendedor (Core Engine). */
export interface StoreRepository {
  /** Crea la tienda del vendedor autenticado (`POST /vendedores/tienda`). */
  createStore(draft: StoreDraft): Observable<Store>;
  /** Tienda del vendedor autenticado o `null` (`GET /vendedores/me/tienda`, 404 → null). */
  getMyStore(): Observable<Store | null>;
  /** Catálogo global para elegir productos a ofertar (`GET /catalog/productos`). */
  listCatalog(): Observable<CatalogProductOption[]>;
  /** Publica un producto con margen (`POST /vendedores/productos`). */
  publishOffer(offer: OfferDraft): Observable<void>;
}

export const STORE_REPOSITORY = new InjectionToken<StoreRepository>('StoreRepository');
