import { Routes } from '@angular/router';
import {
  CATALOG_PRODUCT_REPOSITORY,
  CatalogProductService,
} from '../../applications/products/public-api';
import {
  COMPANY_ORDERS_SOURCE,
  COMPANY_PORTAL_REPOSITORY,
  COMPANY_SERVICE_REPOSITORY,
  CompanyPortalService,
  CompanySalesStore,
  CompanyServiceApiService,
  CompanyServicesStore,
  createCompanyOrdersSource,
  type CompanyPortalRepository,
} from '../../applications/empresas/public-api';

/**
 * Rutas del módulo compartido de Ventas. La composición vive aquí; el dominio,
 * el store y los adaptadores siguen en `features/applications/empresas` y se consumen por su
 * API pública (ADR-63).
 */
export const SALES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/company-sales/company-sales.component'),
    providers: [
      CompanySalesStore,
      CompanyServicesStore,
      { provide: COMPANY_PORTAL_REPOSITORY, useClass: CompanyPortalService },
      {
        provide: COMPANY_ORDERS_SOURCE,
        useFactory: (repository: CompanyPortalRepository) => createCompanyOrdersSource(repository),
        deps: [COMPANY_PORTAL_REPOSITORY],
      },
      { provide: CATALOG_PRODUCT_REPOSITORY, useClass: CatalogProductService },
      { provide: COMPANY_SERVICE_REPOSITORY, useClass: CompanyServiceApiService },
    ],
  },
];
