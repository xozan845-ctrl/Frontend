import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogProductOption } from '../models/store-wizard.model';

/**
 * Puerto de lectura del catálogo global para elegir productos a ofertar
 * (`R-SO-4`: separado de la gestión de la tienda del vendedor).
 */
export interface CatalogRepository {
  /** Catálogo global de productos (`GET /catalog/productos`). */
  listCatalog(): Observable<CatalogProductOption[]>;
}

export const CATALOG_REPOSITORY = new InjectionToken<CatalogRepository>('CatalogRepository');
