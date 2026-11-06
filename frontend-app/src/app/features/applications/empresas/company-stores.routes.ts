import { Routes } from '@angular/router';
import {
  COMPANY_PORTAL_REPOSITORY,
  CompanyPortalService,
  CompanyPortalStore,
} from '../../domains/company-sales/public-api';

/**
 * Ruta lazy del portal de tiendas. Los providers viven aquí para que el
 * dominio de ventas/portal no entre en el bundle inicial.
 */
export const COMPANY_STORES_ROUTES: Routes = [
  {
    path: '',
    providers: [
      CompanyPortalStore,
      { provide: COMPANY_PORTAL_REPOSITORY, useClass: CompanyPortalService },
    ],
    loadComponent: () => import('./pages/company-stores/company-stores.component'),
  },
];
