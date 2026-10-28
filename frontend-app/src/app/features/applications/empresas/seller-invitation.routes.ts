import { Routes } from '@angular/router';
import { COMPANY_INVITATION_REPOSITORY } from './repositories/company-invitation.repository';
import { CompanyInvitationService } from './services/company-invitation/company-invitation.service';
import { SellerInvitationStore } from './state/seller-invitation/seller-invitation.store';

export const SELLER_INVITATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/seller-invitation/seller-invitation.component'),
    providers: [
      SellerInvitationStore,
      { provide: COMPANY_INVITATION_REPOSITORY, useClass: CompanyInvitationService },
    ],
  },
];
