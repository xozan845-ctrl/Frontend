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
  CompanyProfileData,
  CompanySeller,
  CompanyType,
  CreateCompanyData,
  CreateCompanySellerData,
  LogisticsMode,
} from '../../models/company.model';
import { CompanyRepository } from '../../repositories/company.repository';

const MOCK_COMPANY: Company = {
  id: 'empresa-demo',
  name: 'Empresa Demo',
  logisticsMode: 'plataforma',
  type: 'comercial',
  status: 'activa',
  createdBy: 'empresario-demo',
  createdAt: '2026-10-21T00:00:00.000Z',
};

/** Campos de metadatos con su nombre en el contrato público (snake_case). */
const PROFILE_FIELDS: readonly [keyof CompanyProfileData, string][] = [
  ['taxId', 'ruc'],
  ['legalName', 'razon_social'],
  ['commercialName', 'nombre_comercial'],
  ['description', 'descripcion'],
  ['phone', 'telefono'],
  ['contactEmail', 'correo_contacto'],
  ['website', 'sitio_web'],
  ['address', 'direccion'],
  ['city', 'ciudad'],
  ['department', 'departamento'],
  ['country', 'pais'],
  ['currency', 'moneda'],
  ['timezone', 'zona_horaria'],
  ['sector', 'sector'],
  ['legalRepresentative', 'representante_legal'],
  ['businessHours', 'horario_atencion'],
];

/**
 * Gestión de empresas (`/api/v1/empresas`): alta, consulta, perfil
 * comercial/fiscal, slug, tipo, modalidad logística y vendedores.
 * Normaliza con el adapter tolerante (`R-AR-4`) y traduce los errores del
 * backend (`R-AR-9`).
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
      return of({
        ...MOCK_COMPANY,
        name: data.name,
        slug: data.slug,
        logisticsMode: data.logisticsMode,
        type: data.type ?? MOCK_COMPANY.type,
        ...this.profileData(data),
      }).pipe(delay(400));
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .post<unknown>(this.apiUrl, {
        nombre: data.name,
        modalidad_logistica: data.logisticsMode,
        tipo_empresa: data.type,
        slug: data.slug?.trim(),
        ...this.profilePayload(data, { omitEmpty: true }),
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

  updateProfile(id: string, data: CompanyProfileData): Observable<Company> {
    if (this.isMock())
      return of({ ...MOCK_COMPANY, id, ...this.profileData(data) }).pipe(delay(350));
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .patch<unknown>(`${this.apiUrl}/${encodeURIComponent(id)}/perfil`, this.profilePayload(data))
      .pipe(
        map((response) =>
          this.requireCompany(response, 'No se pudo interpretar la empresa actualizada.'),
        ),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo actualizar el perfil.'))),
        ),
      );
  }

  updateSlug(id: string, slug: string): Observable<Company> {
    if (this.isMock()) return of({ ...MOCK_COMPANY, id, slug }).pipe(delay(250));
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http.patch<unknown>(`${this.apiUrl}/${encodeURIComponent(id)}/slug`, { slug }).pipe(
      map((response) =>
        this.requireCompany(response, 'No se pudo interpretar la empresa actualizada.'),
      ),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo actualizar el slug.'))),
      ),
    );
  }

  updateType(id: string, type: CompanyType): Observable<Company> {
    if (this.isMock()) return of({ ...MOCK_COMPANY, id, type }).pipe(delay(250));
    if (!environment.apiUrl) return this.missingApiUrl();

    return this.http
      .patch<unknown>(`${this.apiUrl}/${encodeURIComponent(id)}/tipo`, { tipo_empresa: type })
      .pipe(
        map((response) =>
          this.requireCompany(response, 'No se pudo interpretar la empresa actualizada.'),
        ),
        catchError((error: unknown) =>
          throwError(() => new Error(toUserMessage(error, 'No se pudo actualizar el tipo.'))),
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

  /** Convierte el modelo de dominio al payload de `CrearEmpresa`/`PerfilEmpresa`. */
  private profilePayload(
    data: CompanyProfileData,
    options: { omitEmpty?: boolean } = {},
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    for (const [key, field] of PROFILE_FIELDS) {
      const value = data[key];
      if (typeof value !== 'string') continue;
      const normalized = value.trim();
      if (options.omitEmpty && !normalized) continue;
      payload[field] = normalized;
    }

    if ('logoObjectId' in data) {
      const logo = data.logoObjectId?.trim();
      if (logo) payload['logo_objeto_id'] = logo;
      else if (!options.omitEmpty) payload['logo_objeto_id'] = null;
    }

    return payload;
  }

  /** Aplica los metadatos al mock sin dejar campos `undefined`. */
  private profileData(data: CompanyProfileData): CompanyProfileData {
    const profile: CompanyProfileData = {};
    for (const [key] of PROFILE_FIELDS) {
      const value = data[key];
      if (typeof value === 'string' && value.trim()) {
        (profile as Record<string, unknown>)[key] = value.trim();
      }
    }
    if (data.logoObjectId?.trim()) profile.logoObjectId = data.logoObjectId.trim();
    return profile;
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
