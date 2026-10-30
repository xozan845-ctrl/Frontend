import { Routes } from '@angular/router';
import {
  CATALOG_PRODUCT_REPOSITORY,
  CatalogProductService,
} from '../../applications/products/public-api';
import {
  COMPANY_CATALOG_OPERATIONS_REPOSITORY,
  COMPANY_SERVICE_REPOSITORY,
  CompanyCatalogOperationsService,
  CompanyCatalogOperationsStore,
  CompanyProductsStore,
  CompanyServiceApiService,
  CompanyServicesStore,
} from '../../applications/empresas/public-api';

/**
 * Rutas del módulo compartido de catálogo. La composición vive aquí; el
 * dominio, los stores y los adaptadores siguen en `features/applications/empresas`
 * (ADR-65).
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
