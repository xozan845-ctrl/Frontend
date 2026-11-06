import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  CompanyService,
  CreateCompanyServiceData,
  UpdateCompanyServiceData,
} from '../models/company-service.model';

/**
 * Puerto HTTP del recurso de servicios de la empresa (`/catalog/servicios`).
 * El backend es la fuente de verdad; el frontend no persiste servicios en
 * `localStorage` (R-PS-02).
 */
export interface CompanyServiceRepository {
  list(): Observable<CompanyService[]>;
  create(data: CreateCompanyServiceData): Observable<CompanyService>;
  update(id: string, data: UpdateCompanyServiceData): Observable<CompanyService>;
  /** Baja lógica en backend. */
  remove(id: string): Observable<void>;
}

export const COMPANY_SERVICE_REPOSITORY = new InjectionToken<CompanyServiceRepository>(
  'CompanyServiceRepository',
);
