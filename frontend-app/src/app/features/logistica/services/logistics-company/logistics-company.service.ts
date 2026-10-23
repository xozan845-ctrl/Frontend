import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { toUserMessage } from '../../../../core/models/api-error';
import { CreateLogisticsCompanyData, LogisticsCompany } from '../../models/logistics-company.model';
import type { LogisticsCompanyRepository } from '../../repositories/logistics-company.repository';

function adapt(raw: unknown): LogisticsCompany | null {
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  const record =
    data?.['data'] && typeof data['data'] === 'object'
      ? (data['data'] as Record<string, unknown>)
      : data;
  if (!record || typeof record['id'] !== 'string') return null;
  return {
    id: record['id'],
    name:
      typeof record['nombre'] === 'string'
        ? record['nombre']
        : String(record['name'] ?? 'Empresa logística'),
    ...(typeof record['slug'] === 'string' ? { slug: record['slug'] } : {}),
    status:
      typeof record['estado'] === 'string'
        ? record['estado']
        : String(record['status'] ?? 'activa'),
    createdAt:
      typeof record['creado_en'] === 'string'
        ? record['creado_en']
        : String(record['createdAt'] ?? ''),
  };
}

@Injectable({ providedIn: 'root' })
export class LogisticsCompanyService implements LogisticsCompanyRepository {
  private readonly http = inject(HttpClient);
  private readonly endpoint =
    environment.apiConfig?.endpoints?.logisticsCompanies || '/logistics/companies';
  private readonly apiUrl = `${environment.apiUrl}${this.endpoint}`;

  create(data: CreateLogisticsCompanyData): Observable<LogisticsCompany> {
    if (environment.apiConfig?.dataSource === 'mock') {
      return of({
        id: `logistics-company-${Date.now()}`,
        name: data.name,
        ...(data.slug ? { slug: data.slug } : {}),
        status: 'activa',
        createdAt: new Date().toISOString(),
      }).pipe(delay(250));
    }
    if (!environment.apiUrl) {
      return throwError(() => new Error('apiUrl no configurado.'));
    }

    return this.http.post<unknown>(this.apiUrl, { nombre: data.name, slug: data.slug }).pipe(
      map(adapt),
      map((company) => {
        if (!company) throw new Error('No se pudo interpretar la empresa logística creada.');
        return company;
      }),
      catchError((error: unknown) =>
        throwError(() => new Error(toUserMessage(error, 'No se pudo crear la empresa logística.'))),
      ),
    );
  }
}
