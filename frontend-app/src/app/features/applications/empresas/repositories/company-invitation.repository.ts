import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  AcceptedSellerInvitation,
  AcceptSellerInvitationData,
  CompanyVendorsSnapshot,
  CreateSellerInvitationData,
  PublicSellerInvitation,
  SellerInvitation,
} from '../models/company-invitation.model';

export interface CompanyInvitationRepository {
  create(companyId: string, data: CreateSellerInvitationData): Observable<SellerInvitation>;
  list(companyId: string): Observable<CompanyVendorsSnapshot>;
  revoke(companyId: string, invitationId: string): Observable<boolean>;
  getPublic(token: string): Observable<PublicSellerInvitation>;
  accept(token: string, data: AcceptSellerInvitationData): Observable<AcceptedSellerInvitation>;
}

export const COMPANY_INVITATION_REPOSITORY = new InjectionToken<CompanyInvitationRepository>(
  'CompanyInvitationRepository',
);
