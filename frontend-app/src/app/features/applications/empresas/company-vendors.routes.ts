import { Routes } from '@angular/router';
import { COMPANY_INVITATION_REPOSITORY } from './repositories/company-invitation.repository';
import { COMPANY_PORTAL_REPOSITORY } from './repositories/company-portal.repository';
import { CompanyInvitationService } from './services/company-invitation/company-invitation.service';
import { CompanyPortalService } from './services/company-portal/company-portal.service';
import { CompanyInvitationsStore } from './state/company-invitations/company-invitations.store';
import { CompanyPortalStore } from './state/company-portal/company-portal.store';

export const COMPANY_VENDORS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/company-vendors/company-vendors.component'),
    providers: [
      CompanyInvitationsStore,
      { provide: COMPANY_INVITATION_REPOSITORY, useClass: CompanyInvitationService },
      CompanyPortalStore,
      { provide: COMPANY_PORTAL_REPOSITORY, useClass: CompanyPortalService },
    ],
  },
];
