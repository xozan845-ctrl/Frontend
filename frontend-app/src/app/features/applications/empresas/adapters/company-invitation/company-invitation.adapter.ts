import { adaptAuthResponseFromBackend, type AuthResponse } from '../../../auth/public-api';
import type {
  CompanyVendorsSnapshot,
  PublicSellerInvitation,
  SellerInvitation,
  SellerInvitationSummary,
} from '../../models/company-invitation.model';
import type { CompanySeller } from '../../models/company.model';

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function number(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0;
}

function unwrap(value: unknown): Record<string, unknown> | null {
  const root = record(value);
  if (!root) return null;
  return record(root['data']) ?? root;
}

export function adaptSellerInvitationFromBackend(raw: unknown): SellerInvitation | null {
  const item = unwrap(raw);
  if (!item || !text(item['id'])) return null;

  return {
    id: text(item['id']),
    companyId: text(item['empresa_id'] ?? item['empresaId']),
    storeId: text(item['tienda_id'] ?? item['storeId']),
    storeName: text(item['tienda_nombre'] ?? item['storeName']),
    email: text(item['correo'] ?? item['email']),
    participationPercentage: number(
      item['participacion_porcentaje'] ?? item['participationPercentage'],
    ),
    status: text(item['estado'] ?? item['status']) || 'pendiente',
    expiresAt: text(item['expira_en'] ?? item['expiresAt']),
    invitationUrl: text(item['url_invitacion'] ?? item['invitationUrl']),
  };
}

export function adaptSellerInvitationSummaryFromBackend(
  raw: unknown,
): SellerInvitationSummary | null {
  const item = unwrap(raw);
  if (!item || !text(item['id'])) return null;

  return {
    id: text(item['id']),
    email: text(item['correo'] ?? item['email']),
    storeId: text(item['tienda_id'] ?? item['storeId']),
    storeName: text(item['tienda_nombre'] ?? item['storeName']),
    participationPercentage: number(
      item['participacion_porcentaje'] ?? item['participationPercentage'],
    ),
    status: text(item['estado'] ?? item['status']) || 'pendiente',
    expiresAt: text(item['expira_en'] ?? item['expiresAt']),
  };
}

function adaptSeller(raw: unknown): CompanySeller | null {
  const item = unwrap(raw);
  if (!item || !text(item['id'])) return null;

  return {
    id: text(item['id']),
    name: text(item['nombre'] ?? item['name']) || 'Vendedor',
    email: text(item['correo'] ?? item['email']),
    role: text(item['rol'] ?? item['role']) || 'vendedor',
    participationPercentage: number(
      item['participacion_porcentaje'] ?? item['participationPercentage'],
    ),
    ...(text(item['tienda_id'] ?? item['storeId'])
      ? { storeId: text(item['tienda_id'] ?? item['storeId']) }
      : {}),
    ...(text(item['tienda_nombre'] ?? item['storeName'])
      ? { storeName: text(item['tienda_nombre'] ?? item['storeName']) }
      : {}),
  };
}

export function adaptCompanyVendorsFromBackend(raw: unknown): CompanyVendorsSnapshot {
  const payload = unwrap(raw) ?? {};
  const sellers = Array.isArray(payload['vendedores'])
    ? payload['vendedores']
        .map(adaptSeller)
        .filter((seller): seller is CompanySeller => seller !== null)
    : [];
  const invitations = Array.isArray(payload['invitaciones'])
    ? payload['invitaciones']
        .map(adaptSellerInvitationSummaryFromBackend)
        .filter((invitation): invitation is SellerInvitationSummary => invitation !== null)
    : [];

  return { sellers, invitations };
}

export function adaptPublicSellerInvitationFromBackend(
  raw: unknown,
): PublicSellerInvitation | null {
  const item = unwrap(raw);
  if (!item) return null;

  return {
    valid: item['valida'] === true || item['valid'] === true,
    email: text(item['correo'] ?? item['email']),
    companyName: text(item['empresa_nombre'] ?? item['companyName']),
    storeName: text(item['tienda_nombre'] ?? item['storeName']),
    participationPercentage: number(
      item['participacion_porcentaje'] ?? item['participationPercentage'],
    ),
    expiresAt: text(item['expira_en'] ?? item['expiresAt']),
  };
}

export function adaptAcceptedSellerInvitationFromBackend(raw: unknown): AuthResponse {
  return adaptAuthResponseFromBackend(raw);
}
