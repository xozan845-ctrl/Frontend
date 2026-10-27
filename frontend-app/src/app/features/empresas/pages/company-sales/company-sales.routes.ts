import { Routes } from '@angular/router';
import { CATALOG_PRODUCT_REPOSITORY, CatalogProductService } from '../../../products/public-api';
import { COMPANY_PORTAL_REPOSITORY } from '../../repositories/company-portal.repository';
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
      { provide: CATALOG_PRODUCT_REPOSITORY, useClass: CatalogProductService },
    ],
  },
];
