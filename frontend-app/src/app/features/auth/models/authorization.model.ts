import type { User } from './auth.model';

/** Superficies de trabajo; logística es un tenant independiente, nunca plataforma. */
export type Workspace = 'platform' | 'company' | 'store' | 'logistics';

/** Permisos de plataforma, tenant comercial, tienda y logística. */
export type Permission =
  | 'platform:read'
  | 'platform:manage-infrastructure'
  | 'platform:manage-tenants'
  | 'platform:manage-users'
  | 'platform:manage-billing'
  | 'platform:read-audit'
  | 'company:read'
  | 'company:manage-stores'
  | 'company:manage-sellers'
  | 'company:manage-products'
  | 'company:manage-roles'
  | 'company:manage-billing'
  | 'store:read'
  | 'store:manage'
  | 'store:manage-products'
  | 'store:manage-orders'
  | 'store:manage-clients'
  | 'store:manage-billing'
  | 'store:manage-roles'
  | 'store:manage-logistics'
  | 'logistics:read'
  | 'logistics:manage-fleet'
  | 'logistics:manage-routes'
  | 'logistics:manage-settings'
  | 'logistics:manage-team'
  | 'logistics:manage-billing';

/** Propiedad de una flota: empresa o tienda de un vendedor. */
export type LogisticsOwnership = 'company' | 'store' | 'logistics_company';

const PLATFORM_ROLES = ['admin', 'super_admin'] as const;
const SUPER_ADMIN_ROLES = ['super_admin'] as const;
const COMPANY_OWNER_ROLES = ['empresario'] as const;
const STORE_ROLES = ['vendedor'] as const;
const LOGISTICS_COMPANY_OWNER_ROLES = ['empresario', 'vendedor', 'empresa_logistica'] as const;
const LOGISTICS_COMPANY_ROLES = ['empresa_logistica'] as const;
const LOGISTICS_OPERATOR_ROLES = ['logistica', 'coordinador', 'supervisor', 'operativo'] as const;

const DEFAULT_ROLE_PERMISSIONS: Readonly<Record<string, readonly Permission[]>> = {
  super_admin: [
    'platform:read',
    'platform:manage-infrastructure',
    'platform:manage-tenants',
    'platform:manage-users',
    'platform:manage-billing',
    'platform:read-audit',
  ],
  admin: ['platform:read', 'platform:manage-users', 'platform:read-audit'],
  empresario: [
    'company:read',
    'company:manage-stores',
    'company:manage-sellers',
    'company:manage-products',
    'company:manage-roles',
    'company:manage-billing',
    'store:read',
    'store:manage',
    'store:manage-products',
    'store:manage-orders',
    'store:manage-clients',
    'store:manage-billing',
    'store:manage-roles',
    'store:manage-logistics',
    'logistics:read',
    'logistics:manage-fleet',
    'logistics:manage-routes',
    'logistics:manage-settings',
  ],
  vendedor: [
    'store:read',
    'store:manage',
    'store:manage-products',
    'store:manage-orders',
    'store:manage-clients',
    'store:manage-billing',
    'store:manage-roles',
    'store:manage-logistics',
    'logistics:read',
    'logistics:manage-fleet',
    'logistics:manage-routes',
    'logistics:manage-settings',
  ],
  logistica: ['logistics:read', 'logistics:manage-routes'],
  coordinador: ['logistics:read', 'logistics:manage-routes'],
  supervisor: ['logistics:read', 'logistics:manage-routes'],
  operativo: ['logistics:read'],
  empresa_logistica: [
    'logistics:read',
    'logistics:manage-fleet',
    'logistics:manage-routes',
    'logistics:manage-settings',
    'logistics:manage-team',
    'logistics:manage-billing',
  ],
};

export function isPlatformRole(role?: string): boolean {
  return !!role && PLATFORM_ROLES.includes(role as (typeof PLATFORM_ROLES)[number]);
}

export function isSuperAdminRole(role?: string): boolean {
  return !!role && SUPER_ADMIN_ROLES.includes(role as (typeof SUPER_ADMIN_ROLES)[number]);
}

export function isCompanyOwnerRole(role?: string): boolean {
  return !!role && COMPANY_OWNER_ROLES.includes(role as (typeof COMPANY_OWNER_ROLES)[number]);
}

export function isStoreWorkspaceRole(role?: string): boolean {
  return !!role && STORE_ROLES.includes(role as (typeof STORE_ROLES)[number]);
}

/** Indica si la sesión posee un tenant logístico separado del comercial. */
export function isLogisticsCompanyMember(user?: User | null): boolean {
  return !!user?.logisticsCompanyId;
}

/** Solo el propietario del tenant logístico puede administrarlo. */
export function isLogisticsCompanyOwner(user?: User | null): boolean {
  return (
    !!user &&
    LOGISTICS_COMPANY_OWNER_ROLES.includes(
      user.role as (typeof LOGISTICS_COMPANY_OWNER_ROLES)[number],
    ) &&
    !!user.logisticsCompanyId &&
    user.logisticsCompanyRole === 'owner'
  );
}

export function isLogisticsOperatorRole(role?: string): boolean {
  return (
    !!role && LOGISTICS_OPERATOR_ROLES.includes(role as (typeof LOGISTICS_OPERATOR_ROLES)[number])
  );
}

/**
 * Determina si una sesión puede entrar a una superficie. Esto solo controla la
 * UX y el enrutado; la API debe volver a evaluar tenant, recurso y permiso con
 * RLS antes de leer o mutar datos.
 */
export function canEnterWorkspace(user: User | null | undefined, workspace: Workspace): boolean {
  if (!user) return false;

  switch (workspace) {
    case 'platform':
      return isPlatformRole(user.role);
    case 'company':
      // El empresario puede entrar al workspace para completar el alta de su
      // tenant; las mutaciones y la logística sí exigen tenant activo.
      return isCompanyOwnerRole(user.role);
    case 'store':
      return isStoreWorkspaceRole(user.role) && !!user.tenantId && !!user.storeId;
    case 'logistics':
      // La logística puede pertenecer a un tenant comercial o a un tenant
      // logístico independiente; nunca se concede a la plataforma.
      return (
        ((isCompanyOwnerRole(user.role) ||
          isStoreWorkspaceRole(user.role) ||
          isLogisticsOperatorRole(user.role) ||
          LOGISTICS_COMPANY_ROLES.includes(
            user.role as (typeof LOGISTICS_COMPANY_ROLES)[number],
          )) &&
          (!!user.tenantId || !!user.logisticsCompanyId)) ||
        isLogisticsCompanyOwner(user)
      );
  }
}

function permissionWorkspace(permission: Permission): Workspace {
  if (permission.startsWith('platform:')) return 'platform';
  if (permission.startsWith('company:')) return 'company';
  if (permission.startsWith('store:')) return 'store';
  return 'logistics';
}

/** Resuelve un permiso considerando rol, tenant y permisos delegados. */
export function hasPermission(user: User | null | undefined, permission: Permission): boolean {
  if (!user || !canEnterWorkspace(user, permissionWorkspace(permission))) return false;

  // Una lista entregada por backend representa una delegación explícita. Los
  // propietarios siguen teniendo potestad absoluta sobre su propio dominio.
  if (
    user.permissions?.length &&
    !isCompanyOwnerRole(user.role) &&
    !isLogisticsCompanyOwner(user)
  ) {
    return user.permissions.includes(permission);
  }

  if (isLogisticsCompanyOwner(user) && permission.startsWith('logistics:')) {
    return [
      'logistics:read',
      'logistics:manage-fleet',
      'logistics:manage-routes',
      'logistics:manage-settings',
      'logistics:manage-team',
      'logistics:manage-billing',
    ].includes(permission);
  }

  return DEFAULT_ROLE_PERMISSIONS[user.role ?? '']?.includes(permission) ?? false;
}

/**
 * La flota tiene propietario único: empresa o tienda. Un vendedor que usa la
 * flota de empresa puede operar rutas asignadas, pero no administrar esa flota.
 */
export function canManageLogistics(
  user: User | null | undefined,
  ownership: LogisticsOwnership,
): boolean {
  if (!user || !hasPermission(user, 'logistics:manage-fleet')) return false;
  if (ownership === 'logistics_company') return isLogisticsCompanyOwner(user);
  if (ownership === 'company') return isCompanyOwnerRole(user.role);
  return user.role === 'vendedor';
}

/** Solo propietarios del contexto pueden delegar permisos sin elevar alcance. */
export function canManageStoreRoles(user: User | null | undefined): boolean {
  return hasPermission(user, 'store:manage-roles');
}

export function workspaceLanding(user: User | null | undefined): string {
  if (!user) return '/login';
  if (isPlatformRole(user.role)) return '/admin/inventario';
  if (isCompanyOwnerRole(user.role)) return '/empresa/inicio';
  if (isStoreWorkspaceRole(user.role)) return '/vendedor/inicio';
  if (isLogisticsCompanyMember(user) || user.role === 'empresa_logistica') {
    return '/logistica/dashboard';
  }
  if (isLogisticsOperatorRole(user.role)) return '/logistica/dashboard';
  return '/';
}
