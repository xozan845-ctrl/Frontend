import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {
  canEnterWorkspace,
  hasPermission,
  workspaceLanding,
  type Permission,
} from '../../models/authorization.model';
import { AuthStore } from '../../state/auth/auth.store';

/**
 * Guard de módulo: resuelve workspace y permiso desde el registro único.
 * La autorización real sigue viviendo en el backend/RLS; este guard evita
 * navegación incoherente y oculta superficies de otro workspace.
 */
export function moduleGuard(moduleId: string): CanActivateFn {
  return async (_route, state) => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    if (!authStore.isAuthenticated() && authStore.refreshToken()) {
      await authStore.refreshTokenOnce();
    }

    const user = authStore.user();
    const { workspaceModuleById } =
      await import('../../../../core/workspace/constants/workspace-modules.constants');
    const module = workspaceModuleById(moduleId);
    const allowed =
      !!module &&
      canEnterWorkspace(user, module.workspace) &&
      (!module.permission || hasPermission(user, module.permission as Permission));

    if (allowed) return true;

    if (!user) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }

    return router.createUrlTree([workspaceLanding(user)]);
  };
}
