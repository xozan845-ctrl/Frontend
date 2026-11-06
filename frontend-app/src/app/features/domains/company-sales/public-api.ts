/** API pública del dominio de ventas y portal de empresa (`R-CX-6`). */
export type {
  CompanyRecurringClient,
  CompanySaleClientDraft,
  CompanySaleClientMode,
  CompanySaleFilters,
  CompanySaleKpis,
  CompanySaleLine,
  CompanySaleLineKind,
  CompanySaleMutationResult,
  CompanySalePaymentFilter,
  CompanySalePaymentGroup,
  CompanySalePaymentMethod,
  CompanySalePeriod,
  CompanySaleRecord,
  CompanySaleRow,
  CompanySaleStatus,
  CreateCompanySalePayload,
} from './models/company-sale.model';
export type {
  CompanySale,
  CompanySalesAccount,
  CompanySalesSummary,
} from './models/company-sales.model';
export type { CompanyStore } from './models/company-store.model';
export {
  COMPANY_SALE_PAGE_SIZE,
  COMPANY_SALE_PAYMENT_FILTERS,
  COMPANY_SALE_PAYMENT_LABELS,
  COMPANY_SALE_PAYMENT_METHODS,
  COMPANY_SALE_PERIODS,
  COMPANY_SALE_RECURRING_DAYS,
  COMPANY_SALE_RECURRING_ORDERS,
  companySalesStorageKey,
  createCompanySaleLineId,
} from './constants/company-sales.constants';
export {
  buildCompanySaleRows,
  buildRecurringClients,
  companySalePaymentLabel,
  companySalePeriodRange,
  computeCompanySaleKpis,
  createCompanySaleId,
  createCompanySaleRecord,
  filterCompanySaleRows,
  nextCompanySaleNumber,
  sanitizeCompanySaleRecords,
} from './adapters/company-sale/company-sale.adapter';
export { adaptCompanyOrdersFromBackend } from './adapters/company-order/company-order.adapter';
export {
  adaptCompanySaleFromBackend,
  adaptCompanySalesAccountFromBackend,
} from './adapters/company-sales/company-sales.adapter';
export {
  adaptCompanyStoreFromBackend,
  adaptCompanyStoresFromBackend,
} from './adapters/company-store/company-store.adapter';
export {
  COMPANY_ORDERS_SOURCE,
  COMPANY_PORTAL_REPOSITORY,
  type CompanyOrderFilters,
  type CompanyPortalRepository,
} from './repositories/company-portal.repository';
export { CompanyPortalService } from './services/company-portal/company-portal.service';
export { createCompanyOrdersSource } from './services/company-orders-source/company-orders-source.service';
export { CompanySalesStore } from './state/company-sales/company-sales.store';
export { CompanyPortalStore } from './state/company-portal/company-portal.store';
