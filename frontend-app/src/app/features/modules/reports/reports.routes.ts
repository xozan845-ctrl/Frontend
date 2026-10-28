import { Routes } from '@angular/router';
import {
  COMPANY_REPORTS_SCOPE_CONFIG,
  COMPANY_PORTAL_REPOSITORY,
  CompanyPortalService,
  CompanyReportsSource,
} from '../../applications/empresas/public-api';
import { REPORTS_SCOPE_CONFIG } from '../../../shared/reports/constants/reports-config.tokens';
import {
  VENDOR_REPORTS_SCOPE_CONFIG,
  VendorReportsSource,
} from '../../applications/vendor/public-api';
import { REPORTS_DATA_SOURCE, ReportsStore } from '../../domains/reports/public-api';

const reportsModule = () =>
  import('./pages/reports/reports.component').then((module) => module.default);

/** Reportes de empresa: fuente del tenant y configuración de workspace. */
export const COMPANY_REPORTS_ROUTES: Routes = [
  {
    path: '',
    providers: [
      ReportsStore,
      { provide: REPORTS_SCOPE_CONFIG, useValue: COMPANY_REPORTS_SCOPE_CONFIG },
      { provide: REPORTS_DATA_SOURCE, useClass: CompanyReportsSource },
      { provide: COMPANY_PORTAL_REPOSITORY, useClass: CompanyPortalService },
    ],
    loadComponent: reportsModule,
  },
];

/** Reportes de tienda: fuente del vendedor y configuración de workspace. */
export const VENDOR_REPORTS_ROUTES: Routes = [
  {
    path: '',
    providers: [
      ReportsStore,
      { provide: REPORTS_SCOPE_CONFIG, useValue: VENDOR_REPORTS_SCOPE_CONFIG },
      { provide: REPORTS_DATA_SOURCE, useClass: VendorReportsSource },
    ],
    loadComponent: reportsModule,
  },
];
