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
export type {
  CompanyRecurringClient,
  CompanySaleClientMode,
  CompanySaleKpis,
  CompanySaleLine,
  CompanySalePaymentFilter,
  CompanySalePaymentMethod,
  CompanySalePeriod,
  CompanySaleRow,
  CreateCompanySalePayload,
} from './models/company-sale.model';
export {
  COMPANY_SALE_PAYMENT_FILTERS,
  COMPANY_SALE_PAYMENT_METHODS,
  COMPANY_SALE_PERIODS,
  createCompanySaleLineId,
} from './constants/company-sales.constants';
export { CompanyStore } from './state/company/company.store';
export { CompanySalesStore } from './state/company-sales/company-sales.store';
export { CompanyService } from './services/company/company.service';
export { CompanyPortalService } from './services/company-portal/company-portal.service';
export { CompanyReportsSource } from './services/company-reports/company-reports.service';
export { COMPANY_REPORTS_SCOPE_CONFIG } from './constants/company-reports.config';
export { createCompanyOrdersSource } from './services/company-orders-source/company-orders-source.service';
export { COMPANY_REPOSITORY, type CompanyRepository } from './repositories/company.repository';
export {
  COMPANY_ORDERS_SOURCE,
  COMPANY_PORTAL_REPOSITORY,
  type CompanyPortalRepository,
} from './repositories/company-portal.repository';
