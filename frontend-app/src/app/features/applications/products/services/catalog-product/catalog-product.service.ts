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
  CatalogProductPage,
  CreateCatalogProductVariantData,
  CreateCatalogProductData,
  ProductImageData,
  UpdateCatalogProductVariantData,
  UpdateCatalogProductData,
} from '../../models/catalog-product.model';
import { CatalogProductRepository } from '../../repositories/catalog-product.repository';

/**
 * Catálogo maestro (`/catalog/productos`): listado público con filtros, detalle
 * y CRUD del empresario. Normaliza con el adapter tolerante (`R-AR-4`) y
 * traduce los errores (`R-AR-9`).
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
    if (filters.companyId?.trim()) params['empresa_id'] = filters.companyId.trim();
    if (filters.q?.trim()) params['q'] = filters.q.trim();
    if (filters.status) params['estado'] = filters.status;
    if (filters.category?.trim()) params['categoria'] = filters.category.trim();
    // Core Engine valida `pagina`/`limite` como números sin transformar la query
    // string; se omiten los valores por defecto para que el listado inicial no
    // reciba un 400. La paginación explícita queda pendiente del fix del backend.
    if (filters.page && filters.page > 1) params['pagina'] = filters.page;
    if (filters.limit && filters.limit !== 20) params['limite'] = filters.limit;

    return this.http.get<unknown>(`${environment.apiUrl}${this.endpoint}`, { params }).pipe(
      map((response) => adaptCatalogProductPageFromBackend(response, environment.apiUrl)),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo cargar el catálogo.'))),
      ),
    );
  }

  getById(id: string, companyId?: string): Observable<CatalogProduct> {
    if (!environment.apiUrl) return this.missingApiUrl();

    const params: Record<string, string> = {};
    if (companyId?.trim()) params['empresa_id'] = companyId.trim();

    return this.http
      .get<unknown>(`${environment.apiUrl}${this.endpoint}/${encodeURIComponent(id)}`, { params })
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
        ...(data.companyId ? { empresa_id: data.companyId } : {}),
        nombre: data.name,
        ...(data.description !== undefined ? { descripcion: data.description } : {}),
        ...(data.category !== undefined ? { categoria: data.category } : {}),
        precio_base: data.basePrice,
        stock: data.stock,
        ...(data.attributes !== undefined ? { atributos: data.attributes } : {}),
        ...(data.images
          ? { imagenes: data.images.map((image) => this.toImagePayload(image)) }
          : {}),
        ...(data.variants
          ? { variantes: data.variants.map((variant) => this.toVariantPayload(variant)) }
          : {}),
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
        ...this.toUpdatePayload(data),
      })
      .pipe(
        map((response) => this.requireProduct(response)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo actualizar el producto.'))),
        ),
      );
  }

  createVariant(id: string, data: CreateCatalogProductVariantData): Observable<CatalogProduct> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(
        `${environment.apiUrl}${this.endpoint}/${encodeURIComponent(id)}/variantes`,
        this.toVariantPayload(data),
      )
      .pipe(
        map((response) => this.requireProduct(response)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo crear la variante.'))),
        ),
      );
  }

  updateVariant(
    id: string,
    variantId: string,
    data: UpdateCatalogProductVariantData,
  ): Observable<CatalogProduct> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .patch<unknown>(
        `${environment.apiUrl}${this.endpoint}/${encodeURIComponent(id)}/variantes/${encodeURIComponent(variantId)}`,
        this.toUpdatePayload(data),
      )
      .pipe(
        map((response) => this.requireProduct(response)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo actualizar la variante.'))),
        ),
      );
  }

  deleteVariant(id: string, variantId: string): Observable<void> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .delete<void>(
        `${environment.apiUrl}${this.endpoint}/${encodeURIComponent(id)}/variantes/${encodeURIComponent(variantId)}`,
      )
      .pipe(
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo eliminar la variante.'))),
        ),
      );
  }

  addImage(id: string, data: ProductImageData): Observable<CatalogProduct> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(
        `${environment.apiUrl}${this.endpoint}/${encodeURIComponent(id)}/imagenes`,
        this.toImagePayload(data),
      )
      .pipe(
        map((response) => this.requireProduct(response)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo agregar la imagen.'))),
        ),
      );
  }

  deleteImage(id: string, imageId: string): Observable<void> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .delete<void>(
        `${environment.apiUrl}${this.endpoint}/${encodeURIComponent(id)}/imagenes/${encodeURIComponent(imageId)}`,
      )
      .pipe(
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo eliminar la imagen.'))),
        ),
      );
  }

  private requireProduct(response: unknown): CatalogProduct {
    const product = adaptCatalogProductFromBackend(response, environment.apiUrl);
    if (!product) throw new Error('No se pudo interpretar el producto.');
    return product;
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }

  private toImagePayload(data: ProductImageData): Record<string, unknown> {
    return {
      objeto_id: data.objectId,
      ...(data.order !== undefined ? { orden: data.order } : {}),
      ...(data.isPrimary !== undefined ? { es_principal: data.isPrimary } : {}),
    };
  }

  private toVariantPayload(data: CreateCatalogProductVariantData): Record<string, unknown> {
    return {
      sku: data.sku,
      ...(data.name !== undefined ? { nombre: data.name } : {}),
      ...(data.attributes !== undefined ? { atributos: data.attributes } : {}),
      precio_base: data.basePrice,
      stock: data.stock,
      ...(data.images ? { imagenes: data.images.map((image) => this.toImagePayload(image)) } : {}),
    };
  }

  private toUpdatePayload(data: UpdateCatalogProductData): Record<string, unknown> {
    return {
      ...(data.name !== undefined ? { nombre: data.name } : {}),
      ...(data.description !== undefined ? { descripcion: data.description } : {}),
      ...(data.category !== undefined ? { categoria: data.category } : {}),
      ...(data.basePrice !== undefined ? { precio_base: data.basePrice } : {}),
      ...(data.stock !== undefined ? { stock: data.stock } : {}),
      ...(data.attributes !== undefined ? { atributos: data.attributes } : {}),
      ...(data.reason !== undefined ? { motivo: data.reason } : {}),
    };
  }
}
