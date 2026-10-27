import { Routes } from '@angular/router';
import { COMPANY_PORTAL_REPOSITORY } from '../../repositories/company-portal.repository';
import { CompanyPortalService } from '../../services/company-portal/company-portal.service';
import { CompanyClientsStore } from '../../state/company-clients/company-clients.store';

export const COMPANY_CLIENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./company-clients.component'),
    providers: [
      CompanyClientsStore,
      { provide: COMPANY_PORTAL_REPOSITORY, useClass: CompanyPortalService },
    ],
  },
];
