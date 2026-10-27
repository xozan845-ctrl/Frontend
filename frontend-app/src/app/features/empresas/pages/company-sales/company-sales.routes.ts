import { Routes } from '@angular/router';
import { CATALOG_PRODUCT_REPOSITORY, CatalogProductService } from '../../../products/public-api';
import {
  COMPANY_ORDERS_SOURCE,
  COMPANY_PORTAL_REPOSITORY,
  type CompanyPortalRepository,
} from '../../repositories/company-portal.repository';
import { createCompanyOrdersSource } from '../../services/company-orders-source/company-orders-source.service';
import { CompanyPortalService } from '../../services/company-portal/company-portal.service';
import { CompanySalesStore } from '../../state/company-sales/company-sales.store';
import { CompanyServicesStore } from '../../state/company-services/company-services.store';

export const COMPANY_SALES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./company-sales.component'),
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
    ],
  },
];
