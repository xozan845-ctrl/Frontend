/** API pública del dominio de catálogo administrable de empresa (`R-CX-6`). */
export type {
  CompanyCatalogFieldType,
  CompanyCatalogFilters,
  CompanyCatalogFormValue,
  CompanyCatalogKind,
  CompanyCatalogModalMode,
  CompanyCatalogMutationResult,
  CompanyCatalogRow,
  CompanyCatalogSort,
  CompanyCatalogStatus,
  CompanyCatalogStatusFilter,
  CompanyCatalogTab,
  CompanyProductKpis,
} from './models/company-catalog.model';
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
  CompanyInventoryMovementView,
  CompanyInventorySettings,
  CompanyInventorySettingsFormValue,
  CompanyProductImportResult,
  CompanyProductImportRow,
  CompanyPromotion,
  CompanyPromotionFormValue,
  CompanyPromotionType,
  CompanyPromotionView,
  CompanyScanResult,
} from './models/company-catalog-operations.model';
export type {
  CompanyService as CompanyServiceModel,
  CompanyServiceFilters,
  CompanyServiceStatus,
  CreateCompanyServiceData,
  UpdateCompanyServiceData,
} from './models/company-service.model';
export {
  COMPANY_CATALOG_SORT_LABELS,
  COMPANY_PRODUCT_CONTENT_UNITS,
  COMPANY_PRODUCT_PURCHASE_UNITS,
  COMPANY_PRODUCT_UNITS,
} from './constants/company-products.constants';
export { COMPANY_SERVICE_MAX_DURATION_MINUTES } from './constants/company-services.constants';
export {
  buildProductRow,
  buildServiceRow,
} from './adapters/company-catalog/company-catalog.adapter';
export { parseProductsCsv } from './models/company-product-import.parser';
export { CompanyProductsStore } from './state/company-products/company-products.store';
export { CompanyServicesStore } from './state/company-services/company-services.store';
export { CompanyCatalogOperationsStore } from './state/company-catalog-operations/company-catalog-operations.store';
export { CompanyServiceApiService } from './services/company-service/company-service-api.service';
export { CompanyCatalogOperationsService } from './services/company-catalog-operations/company-catalog-operations.service';
export {
  COMPANY_SERVICE_REPOSITORY,
  type CompanyServiceRepository,
} from './repositories/company-service.repository';
export {
  COMPANY_CATALOG_OPERATIONS_REPOSITORY,
  type CompanyCatalogOperationsRepository,
} from './repositories/company-catalog-operations.repository';
