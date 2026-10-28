import type { CompanySeller } from '../../models/company.model';
import type {
  SellerInvitation,
  SellerInvitationSummary,
} from '../../models/company-invitation.model';

export interface CompanyInvitationsState {
  sellers: CompanySeller[];
  invitations: SellerInvitationSummary[];
  lastInvitation: SellerInvitation | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}
