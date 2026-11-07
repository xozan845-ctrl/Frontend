import { Routes } from '@angular/router';
import {
  CATALOG_PRODUCT_REPOSITORY,
  CatalogProductService,
} from '../../../domains/catalog/public-api';
import {
  COMPANY_CATALOG_OPERATIONS_REPOSITORY,
  COMPANY_SERVICE_REPOSITORY,
  CompanyCatalogOperationsService,
  CompanyCatalogOperationsStore,
  CompanyProductsStore,
  CompanyServiceApiService,
  CompanyServicesStore,
} from '../../../domains/company-catalog/public-api';

/**
 * Rutas del módulo compartido de catálogo. La composición vive aquí; el
 * dominio, los stores y los adaptadores viven en
 * `features/domains/company-catalog` y `features/domains/catalog` (ADR-76).
 */
export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/company-products/company-products.component'),
    providers: [
      CompanyProductsStore,
      CompanyServicesStore,
      CompanyCatalogOperationsStore,
      { provide: CATALOG_PRODUCT_REPOSITORY, useClass: CatalogProductService },
      { provide: COMPANY_SERVICE_REPOSITORY, useClass: CompanyServiceApiService },
      {
        provide: COMPANY_CATALOG_OPERATIONS_REPOSITORY,
        useClass: CompanyCatalogOperationsService,
      },
    ],
  },
];
