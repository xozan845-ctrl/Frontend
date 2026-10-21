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
  | 'logistica'
  | 'coordinador'
  | 'supervisor'
  | 'operativo';

/** Roles que pueden operar el panel de vendedor (ADR-22, ADR-26). */
const SELLER_ROLES: readonly string[] = ['empresario', 'vendedor'];

/** Indica si el rol puede entrar al panel de vendedor/empresario. */
export function isSellerRole(role?: string): boolean {
  return !!role && SELLER_ROLES.includes(role);
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
