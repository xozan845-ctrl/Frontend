import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {
  canEnterWorkspace,
  isAuthorizedCompanyOwnerRole,
  isStoreWorkspaceRole,
  workspaceLanding,
} from '../../../auth/public-api';
import { AuthStore } from '../../../auth/public-api';

/**
 * La plataforma nunca tiene una flota global. La sesión debe pertenecer a una
 * empresa/tienda o ser personal logístico con tenant asignado.
 */
export const logisticsGuard: CanActivateFn = async (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated() && authStore.refreshToken()) {
    await authStore.refreshTokenOnce();
  }

  const user = authStore.user();
  if (canEnterWorkspace(user, 'logistics')) return true;

  if (!user) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  // Las entradas antiguas `/logistica/**` se resuelven al contexto correcto;
  // un superadmin vuelve a plataforma, nunca a una flota inexistente.
  if (isAuthorizedCompanyOwnerRole(user.role)) {
    return router.createUrlTree(['/empresa/logistica']);
  }
  if (isStoreWorkspaceRole(user.role)) return router.createUrlTree(['/vendedor/logistica']);
  return router.createUrlTree([workspaceLanding(user)]);
};
