import type { AuthResponse } from '../../../auth/public-api';
import type { PublicSellerInvitation } from '../../models/company-invitation.model';

export interface SellerInvitationState {
  invitation: PublicSellerInvitation | null;
  session: AuthResponse | null;
  loading: boolean;
  accepting: boolean;
  error: string | null;
}
