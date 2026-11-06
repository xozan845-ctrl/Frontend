/** API pública del dominio de sesión y autorización (`R-CX-6`). */
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
export { AuthService } from './services/auth/auth.service';
export { adaptAuthResponseFromBackend } from './adapters/auth/auth.adapter';
export { AUTH_REPOSITORY, type AuthRepository } from './repositories/auth.repository';
