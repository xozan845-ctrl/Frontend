import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Company,
  CompanySeller,
  CreateCompanyData,
  CreateCompanySellerData,
  LogisticsMode,
} from '../models/company.model';

/** Puerto de gestión de empresas (Core Engine, `/api/v1/empresas`). */
export interface CompanyRepository {
  /** Crea la empresa del empresario autenticado (`POST /empresas`). */
  create(data: CreateCompanyData): Observable<Company>;
  /** Obtiene una empresa visible para el miembro autenticado (`GET /empresas/:id`). */
  getById(id: string): Observable<Company>;
  /** Cambia la modalidad logística (`PATCH /empresas/:id/logistica`). */
  updateLogistics(id: string, mode: LogisticsMode): Observable<Company>;
  /** Crea un vendedor con participación (`POST /empresas/:id/vendedores`). */
  createSeller(id: string, data: CreateCompanySellerData): Observable<CompanySeller>;
}

export const COMPANY_REPOSITORY = new InjectionToken<CompanyRepository>('CompanyRepository');
