import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { toUserMessage } from '../../../../../core/models/api-error';
import {
  adaptCatalogProductFromBackend,
  adaptCatalogProductPageFromBackend,
} from '../../adapters/catalog-product/catalog-product.adapter';
import {
  CatalogProduct,
  CatalogProductFilters,
  CatalogProductMetadataData,
  CatalogProductPage,
  CreateCatalogProductData,
  UpdateCatalogProductData,
} from '../../models/catalog-product.model';
import { CatalogProductRepository } from '../../repositories/catalog-product.repository';

/** Campos operativos que viajan junto al producto (R-PS-01). */
function metadataPayload(data: CatalogProductMetadataData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.cost !== undefined && data.cost.trim()) payload['costo'] = data.cost.trim();
  if (data.brand !== undefined) payload['marca'] = data.brand;
  if (data.barcode !== undefined) payload['codigo_barras'] = data.barcode;
  if (data.unit !== undefined) payload['unidad'] = data.unit;
  if (data.allowFractions !== undefined) payload['permite_fracciones'] = data.allowFractions;
  if (data.purchaseUnit !== undefined) payload['unidad_compra'] = data.purchaseUnit;
  if (data.contentAmount !== undefined) payload['contenido_cantidad'] = data.contentAmount;
  if (data.contentUnit !== undefined) payload['contenido_unidad'] = data.contentUnit;
  if (data.priceType !== undefined) payload['tipo_precio'] = data.priceType;
  if (data.costType !== undefined) payload['tipo_costo'] = data.costType;
  if (data.minStock !== undefined) payload['stock_minimo'] = data.minStock;
  if (data.maxStock !== undefined) payload['stock_maximo'] = data.maxStock;
  if (data.warrantyMonths !== undefined) payload['garantia_meses'] = data.warrantyMonths;
  if (data.isRawMaterial !== undefined) payload['es_materia_prima'] = data.isRawMaterial;
  if (data.location !== undefined) payload['ubicacion'] = data.location;
  if (data.operationalStatus !== undefined) {
    payload['estado_operativo'] = data.operationalStatus;
  }
  return payload;
}

/**
 * Catálogo maestro (`/catalog/productos`): listado público con filtros, detalle
 * y CRUD del empresario. Normaliza con el adapter tolerante (`R-AR-4`) y
 * traduce los errores (`R-AR-9`). Los metadatos operativos viajan inline, sin
 * `localStorage` (R-PS-01).
 */
@Injectable({
  providedIn: 'root',
})
export class CatalogProductService implements CatalogProductRepository {
  private readonly http = inject(HttpClient);
  private readonly endpoint = environment.apiConfig.endpoints.products;

  list(filters: CatalogProductFilters): Observable<CatalogProductPage> {
    if (!environment.apiUrl) return this.missingApiUrl();

    const params: Record<string, string | number> = {};
    if (filters.q?.trim()) params['q'] = filters.q.trim();
    if (filters.status) params['estado'] = filters.status;
    if (filters.category?.trim()) params['categoria'] = filters.category.trim();
    // Core Engine valida `pagina`/`limite` como números sin transformar la query
    // string; se omiten los valores por defecto para que el listado inicial no
    // reciba un 400. La paginación explícita queda pendiente del fix del backend.
    if (filters.page && filters.page > 1) params['pagina'] = filters.page;
    if (filters.limit && filters.limit !== 20) params['limite'] = filters.limit;

    return this.http.get<unknown>(`${environment.apiUrl}${this.endpoint}`, { params }).pipe(
      map((response) => adaptCatalogProductPageFromBackend(response)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo cargar el catálogo.'))),
      ),
    );
  }

  getById(id: string): Observable<CatalogProduct> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .get<unknown>(`${environment.apiUrl}${this.endpoint}/${encodeURIComponent(id)}`)
      .pipe(
        map((response) => this.requireProduct(response)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo cargar el producto.'))),
        ),
      );
  }

  create(data: CreateCatalogProductData): Observable<CatalogProduct> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(`${environment.apiUrl}${this.endpoint}`, {
        sku: data.sku,
        nombre: data.name,
        descripcion: data.description,
        categoria: data.category,
        precio_base: data.basePrice,
        stock: data.stock,
        ...metadataPayload(data),
      })
      .pipe(
        map((response) => this.requireProduct(response)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo crear el producto.'))),
        ),
      );
  }

  update(id: string, data: UpdateCatalogProductData): Observable<CatalogProduct> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .patch<unknown>(`${environment.apiUrl}${this.endpoint}/${encodeURIComponent(id)}`, {
        nombre: data.name,
        descripcion: data.description,
        categoria: data.category,
        precio_base: data.basePrice,
        stock: data.stock,
        motivo: data.reason,
        ...metadataPayload(data),
      })
      .pipe(
        map((response) => this.requireProduct(response)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo actualizar el producto.'))),
        ),
      );
  }

  private requireProduct(response: unknown): CatalogProduct {
    const product = adaptCatalogProductFromBackend(response);
    if (!product) throw new Error('No se pudo interpretar el producto.');
    return product;
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
