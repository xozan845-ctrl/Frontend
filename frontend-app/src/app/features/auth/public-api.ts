/** API de aplicación pública de `auth` para dominios consumidores. */
export type { BackendRole, CreateUserData, LinkPersonalData, User } from './models/auth.model';
export { isSellerRole } from './models/auth.model';
export { AuthStore } from './state/auth/auth.store';
export { AUTH_REPOSITORY, type AuthRepository } from './repositories/auth.repository';
export { adminGuard, isAdminRole } from './guards/admin/admin.guard';
export { canViewShipments, logisticsGuard } from './guards/logistics/logistics.guard';
