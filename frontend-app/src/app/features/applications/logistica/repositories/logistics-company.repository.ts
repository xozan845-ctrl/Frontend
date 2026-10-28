import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateLogisticsCompanyData, LogisticsCompany } from '../models/logistics-company.model';

export interface LogisticsCompanyRepository {
  create(data: CreateLogisticsCompanyData): Observable<LogisticsCompany>;
}

export const LOGISTICS_COMPANY_REPOSITORY = new InjectionToken<LogisticsCompanyRepository>(
  'LogisticsCompanyRepository',
);
