import { inject, Injector, runInInjectionContext } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {
  canEnterWorkspace,
  hasPermission,
  workspaceLanding,
  type Permission,
} from '@domains/session/public-api';
import { AuthStore } from '@domains/session/public-api';

/**
 * Guard de módulo: resuelve workspace, permiso y disponibilidad desde el
 * registro único y el paquete contratado (ADR-85). La autorización real sigue
 * viviendo en el backend/RLS; este guard evita navegación incoherente y oculta
 * superficies de otro workspace o no habilitadas.
 */
export function moduleGuard(moduleId: string): CanActivateFn {
  return async (_route, state) => {
    const authStore = inject(AuthStore);
    const router = inject(Router);
    const injector = inject(Injector);

    if (!authStore.isAuthenticated() && authStore.refreshToken()) {
      await authStore.refreshTokenOnce();
    }

    const user = authStore.user();
    const [{ workspaceModuleById }, { ModuleAvailabilityService }] = await Promise.all([
      import('@core/workspace/constants/workspace-modules.constants'),
      import('@core/workspace/services/module-availability/module-availability.service'),
    ]);
    const availability = runInInjectionContext(injector, () => inject(ModuleAvailabilityService));
    const module = workspaceModuleById(moduleId);
    const allowed =
      !!module &&
      availability.resolve(module).available &&
      canEnterWorkspace(user, module.workspace) &&
      (!module.permission || hasPermission(user, module.permission as Permission));

    if (allowed) return true;

    if (!user) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }

    return router.createUrlTree([workspaceLanding(user)]);
  };
}
