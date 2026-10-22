import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {
  canEnterWorkspace,
  hasPermission,
  type Permission,
  type Workspace,
  workspaceLanding,
} from '../../models/authorization.model';
import { AuthStore } from '../../state/auth/auth.store';

/**
 * Guard común para módulos que no pertenecen a un único feature. El backend
 * sigue siendo la autoridad; este guard evita navegación incoherente y oculta
 * superficies de otro contexto.
 */
export const workspaceGuard: CanActivateFn = async (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const workspace = route.data['workspace'] as Workspace | undefined;
  const requiredPermission = route.data['permission'] as Permission | undefined;

  if (!authStore.isAuthenticated() && authStore.refreshToken()) {
    await authStore.refreshTokenOnce();
  }

  const user = authStore.user();
  const allowed =
    !!workspace &&
    canEnterWorkspace(user, workspace) &&
    (!requiredPermission || hasPermission(user, requiredPermission));

  if (allowed) return true;

  if (!user) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  return router.createUrlTree([workspaceLanding(user)]);
};
