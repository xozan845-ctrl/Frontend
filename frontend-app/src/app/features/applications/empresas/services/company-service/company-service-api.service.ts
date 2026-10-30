import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { toUserMessage } from '../../../../../core/models/api-error';
import { unwrapApiSingleResponse } from '../../../../../core/models/api-response.dto';
import { adaptCompanyServicesFromBackend } from '../../adapters/company-service/company-service.adapter';
import type {
  CompanyService,
  CreateCompanyServiceData,
  UpdateCompanyServiceData,
} from '../../models/company-service.model';
import type { CompanyServiceRepository } from '../../repositories/company-service.repository';

/** Payload snake_case del recurso de servicios (R-PS-02). */
function servicePayload(
  data: CreateCompanyServiceData | UpdateCompanyServiceData,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if ('code' in data && data.code !== undefined) payload['codigo'] = data.code.trim();
  if (data.name !== undefined) payload['nombre'] = data.name.trim();
  if (data.description !== undefined) payload['descripcion'] = data.description.trim();
  if (data.category !== undefined) payload['categoria'] = data.category.trim();
  if (data.brand !== undefined) payload['marca'] = data.brand.trim();
  if (data.barcode !== undefined) payload['codigo_barras'] = data.barcode.trim();
  if (data.price !== undefined) payload['precio'] = data.price.trim();
  if (data.cost !== undefined) payload['costo'] = data.cost.trim();
  if (data.unit !== undefined) payload['unidad'] = data.unit.trim();
  if (data.durationMinutes !== undefined) {
    payload['duracion_minutos'] = data.durationMinutes;
  }
  if (data.status !== undefined) payload['estado'] = data.status;
  return payload;
}

/** Cantidad de páginas que anuncia el backend (`paginas`/`pages`). */
function servicePageCount(response: unknown): number {
  const page = unwrapApiSingleResponse<Record<string, unknown>>(response);
  if (!page || typeof page !== 'object') return 1;
  const value = page['paginas'] ?? page['pages'] ?? page['totalPages'];
  const count = typeof value === 'string' ? Number(value) : value;
  return typeof count === 'number' && Number.isFinite(count) && count > 1 ? Math.ceil(count) : 1;
}

/** Une páginas descartando duplicados por id o código. */
function mergeServicePages(pages: readonly CompanyService[][]): CompanyService[] {
  const merged: CompanyService[] = [];
  for (const service of pages.flat()) {
    if (merged.some((current) => current.id === service.id)) continue;
    if (merged.some((current) => current.code === service.code)) continue;
    merged.push(service);
  }
  return merged;
}

/**
 * Servicios de la empresa contra `/catalog/servicios` (R-PS-02). El listado y
 * las mutaciones se normalizan con el adapter tolerante y los errores se
 * traducen a mensajes de dominio.
 */
@Injectable({
  providedIn: 'root',
})
export class CompanyServiceApiService implements CompanyServiceRepository {
  private readonly http = inject(HttpClient);
  private readonly endpoint = environment.apiConfig.endpoints.companyServices;

  list(): Observable<CompanyService[]> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.listPage(1).pipe(
      switchMap((first) => {
        const pages = servicePageCount(first);
        if (pages <= 1) {
          return of(adaptCompanyServicesFromBackend(first));
        }
        const requests = Array.from({ length: pages - 1 }, (_, index) => this.listPage(index + 2));
        return forkJoin(requests).pipe(
          map((rest) =>
            mergeServicePages(
              [first, ...rest].map((page) => adaptCompanyServicesFromBackend(page)),
            ),
          ),
        );
      }),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudieron cargar los servicios.'))),
      ),
    );
  }

  /** `GET` de una página; usa el máximo permitido para reducir peticiones. */
  private listPage(page: number): Observable<unknown> {
    const params: Record<string, string | number> = { limite: 100 };
    if (page > 1) params['pagina'] = page;
    return this.http.get<unknown>(`${environment.apiUrl}${this.endpoint}`, { params });
  }

  create(data: CreateCompanyServiceData): Observable<CompanyService> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(`${environment.apiUrl}${this.endpoint}`, servicePayload(data))
      .pipe(
        map((response) => this.requireService(response, 'No se pudo interpretar el servicio.')),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo crear el servicio.'))),
        ),
      );
  }

  update(id: string, data: UpdateCompanyServiceData): Observable<CompanyService> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .patch<unknown>(
        `${environment.apiUrl}${this.endpoint}/${encodeURIComponent(id)}`,
        servicePayload(data),
      )
      .pipe(
        map((response) => this.requireService(response, 'No se pudo interpretar el servicio.')),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo actualizar el servicio.'))),
        ),
      );
  }

  remove(id: string): Observable<void> {
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .delete<void>(`${environment.apiUrl}${this.endpoint}/${encodeURIComponent(id)}`)
      .pipe(
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo eliminar el servicio.'))),
        ),
      );
  }

  /** El backend devuelve un único servicio; se acepta envuelto o plano. */
  private requireService(response: unknown, message: string): CompanyService {
    const [service] = adaptCompanyServicesFromBackend(
      Array.isArray(response) ? response : [response],
    );
    if (!service) throw new Error(message);
    return service;
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
