import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../auth/public-api';
import { canEnterWorkspace } from '../../../auth/public-api';

/**
 * Protege el workspace de empresa: solo el propietario del tenant administra
 * vendedores, logística y configuración consolidada.
 */
export const companyGuard: CanActivateFn = async (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated() && authStore.refreshToken()) {
    await authStore.refreshTokenOnce();
  }

  const user = authStore.user();
  if (canEnterWorkspace(user, 'company')) return true;

  if (!user) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  return router.createUrlTree(['/vendedor/inicio']);
};
