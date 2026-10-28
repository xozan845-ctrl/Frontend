import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { toUserMessage } from '../../../../../core/models/api-error';
import {
  adaptCompanyFromBackend,
  adaptCompanySellerFromBackend,
} from '../../adapters/company/company.adapter';
import {
  Company,
  CompanySeller,
  CreateCompanyData,
  CreateCompanySellerData,
  LogisticsMode,
} from '../../models/company.model';
import { CompanyRepository } from '../../repositories/company.repository';

const MOCK_COMPANY: Company = {
  id: 'empresa-demo',
  name: 'Empresa Demo',
  logisticsMode: 'plataforma',
  status: 'activa',
  createdBy: 'empresario-demo',
  createdAt: '2026-10-21T00:00:00.000Z',
};

/**
 * Gestión de empresas (`/api/v1/empresas`): alta, consulta, modalidad
 * logística y vendedores. Normaliza con el adapter tolerante (`R-AR-4`) y
 * traduce los errores del backend (`R-AR-9`).
 */
@Injectable({
  providedIn: 'root',
})
export class CompanyService implements CompanyRepository {
  private readonly http = inject(HttpClient);
  private readonly endpoint = environment.apiConfig?.endpoints?.companies || '/empresas';
  private readonly apiUrl = `${environment.apiUrl}${this.endpoint}`;

  create(data: CreateCompanyData): Observable<Company> {
    if (this.isMock())
      return of({ ...MOCK_COMPANY, name: data.name, logisticsMode: data.logisticsMode }).pipe(
        delay(400),
      );
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(this.apiUrl, {
        nombre: data.name,
        modalidad_logistica: data.logisticsMode,
      })
      .pipe(
        map((response) =>
          this.requireCompany(response, 'No se pudo interpretar la empresa creada.'),
        ),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo crear la empresa.'))),
        ),
      );
  }

  getById(id: string): Observable<Company> {
    if (this.isMock()) return of(MOCK_COMPANY).pipe(delay(250));
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.get<unknown>(`${this.apiUrl}/${encodeURIComponent(id)}`).pipe(
      map((response) => this.requireCompany(response, 'No se pudo interpretar la empresa.')),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo cargar la empresa.'))),
      ),
    );
  }

  updateLogistics(id: string, mode: LogisticsMode): Observable<Company> {
    if (this.isMock()) return of({ ...MOCK_COMPANY, id, logisticsMode: mode }).pipe(delay(350));
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .patch<unknown>(`${this.apiUrl}/${encodeURIComponent(id)}/logistica`, {
        modalidad_logistica: mode,
      })
      .pipe(
        map((response) =>
          this.requireCompany(response, 'No se pudo interpretar la empresa actualizada.'),
        ),
        catchError((error: unknown) =>
          throwError(
            () => new Error(toUserMessage(error, 'No se pudo actualizar la modalidad logística.')),
          ),
        ),
      );
  }

  createSeller(id: string, data: CreateCompanySellerData): Observable<CompanySeller> {
    if (this.isMock()) {
      return of({
        id: `vendedor-${Date.now()}`,
        name: data.name,
        email: data.email,
        role: 'vendedor',
        participationPercentage: data.participationPercentage,
        ...(data.storeId ? { storeId: data.storeId } : {}),
        ...(data.permissions?.length ? { permissions: data.permissions } : {}),
        ...(data.logisticsOwnership ? { logisticsOwnership: data.logisticsOwnership } : {}),
      }).pipe(delay(400));
    }
    if (!environment.apiUrl) return this.missingApiUrl();

    const payload = {
      nombre: data.name,
      correo: data.email,
      contrasena: data.password,
      participacion_porcentaje: data.participationPercentage,
      ...(data.storeId ? { tienda_id: data.storeId } : {}),
      ...(data.permissions?.length ? { permisos: data.permissions } : {}),
      ...(data.logisticsOwnership ? { logistics_ownership: data.logisticsOwnership } : {}),
    };

    return this.http
      .post<unknown>(`${this.apiUrl}/${encodeURIComponent(id)}/vendedores`, payload)
      .pipe(
        map((response) => adaptCompanySellerFromBackend(response)),
        map((seller) => {
          if (!seller) throw new Error('No se pudo interpretar el vendedor creado.');
          return seller;
        }),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo crear el vendedor.'))),
        ),
      );
  }

  private requireCompany(response: unknown, message: string): Company {
    const company = adaptCompanyFromBackend(response);
    if (!company) throw new Error(message);
    return company;
  }

  private isMock(): boolean {
    return environment.apiConfig?.dataSource === 'mock';
  }

  private missingApiUrl<T>(): Observable<T> {
    return throwError(
      () =>
        new Error('apiUrl no configurado. Define environment.apiUrl para usar el backend real.'),
    );
  }
}
