import { Routes } from '@angular/router';
import { COMPANY_REPOSITORY } from './repositories/company.repository';
import { CompanyService } from './services/company/company.service';
import { CompanyStore } from './state/company/company.store';

/**
 * Rutas de gestión de empresas (`R-AR-12`). Se anidan bajo el shell del panel
 * del vendedor (`/vendedor/empresa`), que ya aplica `vendorGuard`; el store y
 * el puerto se proveen en la ruta lazy para no viajar en el bundle inicial
 * (`R-LZ-1`, `R-AR-3`).
 */
export const EMPRESAS_ROUTES: Routes = [
  {
    path: 'empresa',
    loadComponent: () => import('./pages/company-settings/company-settings.component'),
    providers: [CompanyStore, { provide: COMPANY_REPOSITORY, useClass: CompanyService }],
  },
];
