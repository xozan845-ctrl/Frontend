import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {
  canEnterWorkspace,
  isAuthorizedCompanyOwnerRole,
  isLogisticsCompanyMember,
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
  const isDedicatedLogisticsRoute = state.url.startsWith('/logistica');
  const isCreationRoute = state.url.startsWith('/logistica/crear');

  // `/logistica/**` representa un tenant logístico independiente. El dueño
  // comercial y el vendedor solo llegan ahí después de crear/vincular ese
  // tenant; mientras tanto usan sus workspaces contextuales.
  if (
    canEnterWorkspace(user, 'logistics') &&
    (!isDedicatedLogisticsRoute || isLogisticsCompanyMember(user))
  ) {
    return true;
  }

  if (
    isCreationRoute &&
    !!user &&
    (isAuthorizedCompanyOwnerRole(user.role) || isStoreWorkspaceRole(user.role))
  ) {
    return true;
  }

  if (!user) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  // Las entradas comerciales antiguas se resuelven al contexto correcto;
  // plataforma vuelve a admin y nunca obtiene una flota global.
  if (isAuthorizedCompanyOwnerRole(user.role)) {
    return router.createUrlTree(['/empresa/logistica']);
  }
  if (isStoreWorkspaceRole(user.role)) return router.createUrlTree(['/vendedor/logistica']);
  return router.createUrlTree([workspaceLanding(user)]);
};
