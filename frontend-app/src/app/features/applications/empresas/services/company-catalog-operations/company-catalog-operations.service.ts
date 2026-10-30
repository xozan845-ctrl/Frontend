import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { toUserMessage } from '../../../../../core/models/api-error';
import { unwrapApiSingleResponse } from '../../../../../core/models/api-response.dto';
import {
  adaptCombosFromBackend,
  adaptComboFromBackend,
  adaptImportResultFromBackend,
  adaptInventorySettingsFromBackend,
  adaptMovementsFromBackend,
  adaptMovementFromBackend,
  adaptPromotionsFromBackend,
  adaptPromotionFromBackend,
  adaptScanResultFromBackend,
  comboToCreatePayload,
  comboToUpdatePayload,
  importRowToPayload,
  inventorySettingsToPayload,
  movementToPayload,
  promotionToPayload,
} from '../../adapters/company-catalog-operations/company-catalog-operations.adapter';
import type {
  CompanyCombo,
  CompanyComboFormValue,
  CompanyInventoryMovement,
  CompanyInventoryMovementFormValue,
  CompanyInventorySettings,
  CompanyInventorySettingsFormValue,
  CompanyProductImportResult,
  CompanyProductImportRow,
  CompanyPromotion,
  CompanyPromotionFormValue,
  CompanyScanResult,
} from '../../models/company-catalog-operations.model';
import type { CompanyCatalogOperationsRepository } from '../../repositories/company-catalog-operations.repository';

/** Páginas anunciadas por un listado paginado. */
function responsePageCount(response: unknown): number {
  const page = unwrapApiSingleResponse<Record<string, unknown>>(response);
  if (!page || typeof page !== 'object') return 1;
  const value = page['paginas'] ?? page['pages'] ?? page['totalPages'];
  const count = typeof value === 'string' ? Number(value) : value;
  return typeof count === 'number' && Number.isFinite(count) && count > 1 ? Math.ceil(count) : 1;
}

/** Une páginas descartando duplicados por id. */
function mergePages<T extends { id: string }>(pages: readonly T[][]): T[] {
  const merged: T[] = [];
  for (const item of pages.flat()) {
    if (merged.some((current) => current.id === item.id)) continue;
    merged.push(item);
  }
  return merged;
}

/**
 * Implementación HTTP de las operaciones del catálogo. Todos los listados
 * paginados se recorren completos para que la UI filtre y pagine localmente
 * (R-PS-04).
 */
@Injectable({
  providedIn: 'root',
})
export class CompanyCatalogOperationsService implements CompanyCatalogOperationsRepository {
  private readonly http = inject(HttpClient);

  private endpoint(key: keyof typeof environment.apiConfig.endpoints): string {
    return environment.apiConfig.endpoints[key];
  }

  getInventorySettings(): Observable<CompanyInventorySettings> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .get<unknown>(
        `${environment.apiUrl}${environment.apiConfig.endpoints.catalogInventorySettings}`,
      )
      .pipe(
        map((raw) => this.requireSettings(raw)),
        catchError((error: unknown) =>
          throwError(
            () =>
              new Error(toUserMessage(error, 'No se pudo cargar la configuración de inventario.')),
          ),
        ),
      );
  }

  saveInventorySettings(
    form: CompanyInventorySettingsFormValue,
  ): Observable<CompanyInventorySettings> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .put<unknown>(
        `${environment.apiUrl}${environment.apiConfig.endpoints.catalogInventorySettings}`,
        inventorySettingsToPayload(form),
      )
      .pipe(
        map((raw) => this.requireSettings(raw)),
        catchError((error: unknown) =>
          throwError(
            () =>
              new Error(toUserMessage(error, 'No se pudo guardar la configuración de inventario.')),
          ),
        ),
      );
  }

  listCombos(): Observable<CompanyCombo[]> {
    return this.listAll(this.endpoint('catalogCombos'), adaptCombosFromBackend);
  }

  createCombo(form: CompanyComboFormValue): Observable<CompanyCombo> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(
        `${environment.apiUrl}${environment.apiConfig.endpoints.catalogCombos}`,
        comboToCreatePayload(form),
      )
      .pipe(
        map((raw) => this.requireCombo(raw)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo crear el combo.'))),
        ),
      );
  }

  updateCombo(id: string, form: CompanyComboFormValue): Observable<CompanyCombo> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .patch<unknown>(
        `${environment.apiUrl}${environment.apiConfig.endpoints.catalogCombos}/${encodeURIComponent(id)}`,
        comboToUpdatePayload(form),
      )
      .pipe(
        map((raw) => this.requireCombo(raw)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo actualizar el combo.'))),
        ),
      );
  }

  removeCombo(id: string): Observable<void> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .delete<void>(
        `${environment.apiUrl}${environment.apiConfig.endpoints.catalogCombos}/${encodeURIComponent(id)}`,
      )
      .pipe(
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo eliminar el combo.'))),
        ),
      );
  }

  listPromotions(): Observable<CompanyPromotion[]> {
    return this.listAll(this.endpoint('catalogPromotions'), adaptPromotionsFromBackend);
  }

  createPromotion(form: CompanyPromotionFormValue): Observable<CompanyPromotion> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(
        `${environment.apiUrl}${environment.apiConfig.endpoints.catalogPromotions}`,
        promotionToPayload(form),
      )
      .pipe(
        map((raw) => this.requirePromotion(raw)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo crear la promoción.'))),
        ),
      );
  }

  updatePromotion(id: string, form: CompanyPromotionFormValue): Observable<CompanyPromotion> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .patch<unknown>(
        `${environment.apiUrl}${environment.apiConfig.endpoints.catalogPromotions}/${encodeURIComponent(id)}`,
        promotionToPayload(form),
      )
      .pipe(
        map((raw) => this.requirePromotion(raw)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo actualizar la promoción.'))),
        ),
      );
  }

  removePromotion(id: string): Observable<void> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .delete<void>(
        `${environment.apiUrl}${environment.apiConfig.endpoints.catalogPromotions}/${encodeURIComponent(id)}`,
      )
      .pipe(
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo eliminar la promoción.'))),
        ),
      );
  }

  listMovements(): Observable<CompanyInventoryMovement[]> {
    return this.listAll(this.endpoint('catalogMovements'), adaptMovementsFromBackend);
  }

  createMovement(form: CompanyInventoryMovementFormValue): Observable<CompanyInventoryMovement> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(
        `${environment.apiUrl}${environment.apiConfig.endpoints.catalogMovements}`,
        movementToPayload(form),
      )
      .pipe(
        map((raw) => this.requireMovement(raw)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo registrar el movimiento.'))),
        ),
      );
  }

  importProducts(rows: readonly CompanyProductImportRow[]): Observable<CompanyProductImportResult> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(`${environment.apiUrl}${environment.apiConfig.endpoints.catalogImport}`, {
        filas: rows.map((row) => importRowToPayload(row)),
      })
      .pipe(
        map((raw) => adaptImportResultFromBackend(raw)),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo importar el archivo.'))),
        ),
      );
  }

  scan(code: string): Observable<CompanyScanResult> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .get<unknown>(`${environment.apiUrl}${environment.apiConfig.endpoints.catalogScan}`, {
        params: { codigo: code.trim() },
      })
      .pipe(
        map((raw) => {
          const result = adaptScanResultFromBackend(raw);
          if (!result) throw new Error('No se encontró un producto o servicio con ese código.');
          return result;
        }),
        catchError((error: unknown) =>
          throwError(
            () => new Error(toUserMessage(error, 'No se pudo buscar el código escaneado.')),
          ),
        ),
      );
  }

  /** Recorre todas las páginas de un listado y las normaliza. */
  private listAll<T extends { id: string }>(
    endpoint: string,
    adapt: (response: unknown) => T[],
  ): Observable<T[]> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.getPage(endpoint, 1).pipe(
      switchMap((first) => {
        const pages = responsePageCount(first);
        if (pages <= 1) return of(adapt(first));
        const requests = Array.from({ length: pages - 1 }, (_, index) =>
          this.getPage(endpoint, index + 2),
        );
        return forkJoin(requests).pipe(
          map((rest) => mergePages([first, ...rest].map((page) => adapt(page)))),
        );
      }),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo cargar la información.'))),
      ),
    );
  }

  private getPage(endpoint: string, page: number): Observable<unknown> {
    const params: Record<string, string | number> = { limite: 100 };
    if (page > 1) params['pagina'] = page;
    return this.http.get<unknown>(`${environment.apiUrl}${endpoint}`, { params });
  }

  private requireSettings(raw: unknown): CompanyInventorySettings {
    const settings = adaptInventorySettingsFromBackend(raw);
    if (!settings) throw new Error('No se pudo interpretar la configuración de inventario.');
    return settings;
  }

  private requireCombo(raw: unknown): CompanyCombo {
    const combo = adaptComboFromBackend(raw);
    if (!combo) throw new Error('No se pudo interpretar el combo.');
    return combo;
  }

  private requirePromotion(raw: unknown): CompanyPromotion {
    const promotion = adaptPromotionFromBackend(raw);
    if (!promotion) throw new Error('No se pudo interpretar la promoción.');
    return promotion;
  }

  private requireMovement(raw: unknown): CompanyInventoryMovement {
    const movement = adaptMovementFromBackend(raw);
    if (!movement) throw new Error('No se pudo interpretar el movimiento.');
    return movement;
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
