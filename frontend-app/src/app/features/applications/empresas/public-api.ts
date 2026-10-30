/** API de aplicación pública de `empresas` para dominios consumidores. */
export type {
  Company,
  CompanySeller,
  CreateCompanyData,
  CreateCompanySellerData,
  LogisticsMode,
} from './models/company.model';
export type { CompanyService as CompanyServiceModel } from './models/company-service.model';
export type {
  CompanyServiceStatus,
  CreateCompanyServiceData,
  UpdateCompanyServiceData,
} from './models/company-service.model';
export type {
  CompanyCombo,
  CompanyComboComponent,
  CompanyComboComponentFormValue,
  CompanyComboFormValue,
  CompanyInventoryCostMethod,
  CompanyInventoryMovement,
  CompanyInventoryMovementFormValue,
  CompanyInventoryMovementLine,
  CompanyInventoryMovementType,
  CompanyInventorySettings,
  CompanyInventorySettingsFormValue,
  CompanyProductImportResult,
  CompanyProductImportRow,
  CompanyPromotion,
  CompanyPromotionFormValue,
  CompanyPromotionType,
  CompanyScanResult,
} from './models/company-catalog-operations.model';
export type {
  CompanyCatalogFieldType,
  CompanyCatalogFormValue,
  CompanyCatalogKind,
  CompanyCatalogModalMode,
  CompanyCatalogRow,
  CompanyCatalogSort,
  CompanyCatalogStatus,
  CompanyCatalogStatusFilter,
  CompanyCatalogTab,
} from './models/company-catalog.model';
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
  COMPANY_CATALOG_SORT_LABELS,
  COMPANY_PRODUCT_CONTENT_UNITS,
  COMPANY_PRODUCT_PURCHASE_UNITS,
  COMPANY_PRODUCT_UNITS,
} from './constants/company-products.constants';
export { COMPANY_SERVICE_MAX_DURATION_MINUTES } from './constants/company-services.constants';
export {
  COMPANY_SALE_PAYMENT_FILTERS,
  COMPANY_SALE_PAYMENT_METHODS,
  COMPANY_SALE_PERIODS,
  createCompanySaleLineId,
} from './constants/company-sales.constants';
export { CompanyStore } from './state/company/company.store';
export { CompanySalesStore } from './state/company-sales/company-sales.store';
export { CompanyProductsStore } from './state/company-products/company-products.store';
export { CompanyServicesStore } from './state/company-services/company-services.store';
export { CompanyCatalogOperationsStore } from './state/company-catalog-operations/company-catalog-operations.store';
export {
  buildProductRow,
  buildServiceRow,
} from './adapters/company-catalog/company-catalog.adapter';
export { parseProductsCsv } from './models/company-product-import.parser';
export { CompanyService } from './services/company/company.service';
export { CompanyServiceApiService } from './services/company-service/company-service-api.service';
export { CompanyCatalogOperationsService } from './services/company-catalog-operations/company-catalog-operations.service';
export { CompanyPortalService } from './services/company-portal/company-portal.service';
export { CompanyReportsSource } from './services/company-reports/company-reports.service';
export { COMPANY_REPORTS_SCOPE_CONFIG } from './constants/company-reports.config';
export { createCompanyOrdersSource } from './services/company-orders-source/company-orders-source.service';
export { COMPANY_REPOSITORY, type CompanyRepository } from './repositories/company.repository';
export {
  COMPANY_SERVICE_REPOSITORY,
  type CompanyServiceRepository,
} from './repositories/company-service.repository';
export {
  COMPANY_CATALOG_OPERATIONS_REPOSITORY,
  type CompanyCatalogOperationsRepository,
} from './repositories/company-catalog-operations.repository';
export {
  COMPANY_ORDERS_SOURCE,
  COMPANY_PORTAL_REPOSITORY,
  type CompanyPortalRepository,
} from './repositories/company-portal.repository';
