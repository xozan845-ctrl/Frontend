/**
 * Roles emitidos por Core Engine en `SesionUsuarioResponseDto` y
 * `UsuarioContextoResponseDto` (OpenAPI `/api/v1/auth`).
 */
export type BackendRole =
  | 'super_admin'
  | 'admin'
  | 'empresario'
  | 'vendedor'
  | 'comprador'
  | 'empresa_logistica'
  | 'logistica'
  | 'coordinador'
  | 'supervisor'
  | 'operativo';

/** Roles que pueden operar un negocio (onboarding y contexto comercial). */
const BUSINESS_ROLES: readonly string[] = ['empresario', 'vendedor'];

/** Rol propietario del tenant comercial. */
const COMPANY_OWNER_ROLES: readonly string[] = ['empresario'];

/** Rol operativo de una tienda asignada por el propietario. */
const STORE_SELLER_ROLES: readonly string[] = ['vendedor'];

/** Indica si el rol puede iniciar o administrar un negocio. */
export function isSellerRole(role?: string): boolean {
  return !!role && BUSINESS_ROLES.includes(role);
}

/** Indica si el usuario puede administrar la empresa y sus tiendas. */
export function isCompanyOwnerRole(role?: string): boolean {
  return !!role && COMPANY_OWNER_ROLES.includes(role);
}

/** Indica si el usuario opera una tienda asignada por la empresa. */
export function isStoreSellerRole(role?: string): boolean {
  return !!role && STORE_SELLER_ROLES.includes(role);
}

export interface User {
  id: string | number;
  email: string;
  name: string;
  role?: BackendRole | string;
  avatar?: string;
  /** Empresa activa del JWT (`tenant_id`). */
  tenantId?: string;
  /** Ficha de personal vinculada en field-service (`personal_id`). */
  personalId?: string;
  /** Tienda única asignada al vendedor (`tienda_id`). */
  storeId?: string;
  /** Permisos delegados para roles de tienda o personal de logística. */
  permissions?: readonly string[];
  /** Contexto logístico que el backend asignó a la sesión. */
  logisticsOwnership?: 'company' | 'store' | 'logistics_company';
  /** Tenant independiente de una empresa logística, desacoplado del comercial. */
  logisticsCompanyId?: string;
  /** Rol dentro del tenant logístico independiente. */
  logisticsCompanyRole?: 'owner' | 'member';
}

export interface AuthResponse {
  user: User;
  token?: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  /**
   * Intención de alta: comprador (por defecto), vendedor/empresario (para crear
   * tienda) o facturador. El backend solo registra `empresario` o `comprador`
   * (ADR-26); vendedor/facturador se traducen a `empresario`.
   */
  role?: 'customer' | 'seller' | 'biller';
}

/** Alta administrativa de usuario (`POST /auth/crear-usuario`). */
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: BackendRole;
  tenantId?: string;
  personalId?: string;
}

/** Vinculación de la ficha de personal (`POST /auth/vincular-personal`). */
export interface LinkPersonalData {
  personalId: string;
  name?: string;
}
