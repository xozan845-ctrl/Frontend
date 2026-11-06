/** API de aplicación pública de `empresas` para dominios consumidores. */
export type {
  Company,
  CompanyProfileData,
  CompanySeller,
  CompanyType,
  CreateCompanyData,
  CreateCompanySellerData,
  LogisticsMode,
} from './models/company.model';
export { CompanyStore } from './state/company/company.store';
export { CompanyService } from './services/company/company.service';
export { CompanyReportsSource } from './services/company-reports/company-reports.service';
export { COMPANY_REPORTS_SCOPE_CONFIG } from './constants/company-reports.config';
export { COMPANY_REPOSITORY, type CompanyRepository } from './repositories/company.repository';
