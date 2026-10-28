import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CatalogProduct,
  CatalogProductFilters,
  CatalogProductPage,
  CreateCatalogProductData,
  UpdateCatalogProductData,
} from '../models/catalog-product.model';

/** Puerto del catálogo maestro (`/catalog/productos`). */
export interface CatalogProductRepository {
  /** Lista pública con filtros y paginación (`GET /catalog/productos`). */
  list(filters: CatalogProductFilters): Observable<CatalogProductPage>;
  /** Detalle (`GET /catalog/productos/:id`). */
  getById(id: string): Observable<CatalogProduct>;
  /** Alta (empresario/admin, `POST /catalog/productos`). */
  create(data: CreateCatalogProductData): Observable<CatalogProduct>;
  /** Edición (empresario/admin, `PATCH /catalog/productos/:id`). */
  update(id: string, data: UpdateCatalogProductData): Observable<CatalogProduct>;
}

export const CATALOG_PRODUCT_REPOSITORY = new InjectionToken<CatalogProductRepository>(
  'CatalogProductRepository',
);
