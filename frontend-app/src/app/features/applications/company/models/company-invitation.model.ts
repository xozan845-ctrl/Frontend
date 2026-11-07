import type { AuthResponse } from '../../auth/public-api';
import type { CompanySeller } from './company.model';

/** Datos que el empresario envía para generar una invitación. */
export interface CreateSellerInvitationData {
  email: string;
  storeId: string;
  participationPercentage: number;
  name?: string;
}

/** Invitación recién creada; contiene la URL que el empresario puede compartir. */
export interface SellerInvitation {
  id: string;
  companyId: string;
  storeId: string;
  storeName: string;
  email: string;
  participationPercentage: number;
  status: string;
  expiresAt: string;
  invitationUrl: string;
}

/** Invitación resumida en el listado del workspace empresarial. */
export interface SellerInvitationSummary {
  id: string;
  email: string;
  storeId: string;
  storeName: string;
  participationPercentage: number;
  status: string;
  expiresAt: string;
}

export interface CompanyVendorsSnapshot {
  sellers: CompanySeller[];
  invitations: SellerInvitationSummary[];
}

/** Datos públicos que se pueden mostrar antes de aceptar una invitación. */
export interface PublicSellerInvitation {
  valid: boolean;
  email: string;
  companyName: string;
  storeName: string;
  participationPercentage: number;
  expiresAt: string;
}

export interface AcceptSellerInvitationData {
  name: string;
  password: string;
}

/** La aceptación devuelve la sesión completa del nuevo vendedor. */
export type AcceptedSellerInvitation = AuthResponse;
