import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CatalogProduct,
  CatalogProductFilters,
  CatalogProductPage,
  CreateCatalogProductData,
  CreateCatalogProductVariantData,
  ProductImageData,
  UpdateCatalogProductVariantData,
  UpdateCatalogProductData,
} from '../models/catalog-product.model';

/** Puerto del catálogo maestro (`/catalog/productos`). */
export interface CatalogProductRepository {
  /** Lista pública con filtros y paginación (`GET /catalog/productos`). */
  list(filters: CatalogProductFilters): Observable<CatalogProductPage>;
  /** Detalle (`GET /catalog/productos/:id`). */
  getById(id: string, companyId?: string): Observable<CatalogProduct>;
  /** Alta (empresario/admin, `POST /catalog/productos`). */
  create(data: CreateCatalogProductData): Observable<CatalogProduct>;
  /** Edición (empresario/admin, `PATCH /catalog/productos/:id`). */
  update(id: string, data: UpdateCatalogProductData): Observable<CatalogProduct>;
  /** Agrega una variante al producto padre (`POST /catalog/productos/:id/variantes`). */
  createVariant?(id: string, data: CreateCatalogProductVariantData): Observable<CatalogProduct>;
  /** Edita una variante (`PATCH /catalog/productos/:id/variantes/:varianteId`). */
  updateVariant?(
    id: string,
    variantId: string,
    data: UpdateCatalogProductVariantData,
  ): Observable<CatalogProduct>;
  /** Elimina una variante (`DELETE /catalog/productos/:id/variantes/:varianteId`). */
  deleteVariant?(id: string, variantId: string): Observable<void>;
  /** Agrega una imagen ya confirmada en storage. */
  addImage?(id: string, data: ProductImageData): Observable<CatalogProduct>;
  /** Elimina la relación producto-imagen. */
  deleteImage?(id: string, imageId: string): Observable<void>;
}

export const CATALOG_PRODUCT_REPOSITORY = new InjectionToken<CatalogProductRepository>(
  'CatalogProductRepository',
);
