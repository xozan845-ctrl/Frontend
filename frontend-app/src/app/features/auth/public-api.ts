/** API de aplicación pública de `auth` para dominios consumidores. */
export type {
  AuthResponse,
  BackendRole,
  CreateUserData,
  LinkPersonalData,
  User,
} from './models/auth.model';
export { isCompanyOwnerRole, isSellerRole, isStoreSellerRole } from './models/auth.model';
export type { LogisticsOwnership, Permission, Workspace } from './models/authorization.model';
export {
  canEnterWorkspace,
  canManageLogistics,
  canManageStoreRoles,
  hasPermission,
  isCompanyOwnerRole as isAuthorizedCompanyOwnerRole,
  isLogisticsOperatorRole,
  isLogisticsCompanyMember,
  isLogisticsCompanyOwner,
  isPlatformRole,
  isSuperAdminRole,
  isStoreWorkspaceRole,
  workspaceLanding,
} from './models/authorization.model';
export { AuthStore } from './state/auth/auth.store';
export { adaptAuthResponseFromBackend } from './adapters/auth/auth.adapter';
export { AUTH_REPOSITORY, type AuthRepository } from './repositories/auth.repository';
export { adminGuard, isAdminRole } from './guards/admin/admin.guard';
export { canViewShipments, logisticsGuard } from './guards/logistics/logistics.guard';
export { canViewField, fieldGuard } from './guards/field/field.guard';
export { workspaceGuard } from './guards/workspace/workspace.guard';
export { companyOwnerRedirectGuard } from './guards/company-entry/company-entry.guard';
export { moduleGuard } from './guards/module/module.guard';
