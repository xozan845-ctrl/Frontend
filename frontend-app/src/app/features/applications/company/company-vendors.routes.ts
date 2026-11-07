import { Routes } from '@angular/router';
import { COMPANY_INVITATION_REPOSITORY } from './repositories/company-invitation.repository';
import { COMPANY_PORTAL_REPOSITORY } from '../../domains/company-sales/public-api';
import { CompanyInvitationService } from './services/company-invitation/company-invitation.service';
import { CompanyPortalService } from '../../domains/company-sales/public-api';
import { CompanyInvitationsStore } from './state/company-invitations/company-invitations.store';
import { CompanyPortalStore } from '../../domains/company-sales/public-api';
import { SellerAvatarStore } from './state/seller-avatar/seller-avatar.store';
import { STORAGE_REPOSITORY, StorageService } from '../storage/public-api';

export const COMPANY_VENDORS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/company-vendors/company-vendors.component'),
    providers: [
      CompanyInvitationsStore,
      { provide: COMPANY_INVITATION_REPOSITORY, useClass: CompanyInvitationService },
      CompanyPortalStore,
      { provide: COMPANY_PORTAL_REPOSITORY, useClass: CompanyPortalService },
      SellerAvatarStore,
      { provide: STORAGE_REPOSITORY, useClass: StorageService },
    ],
  },
];
