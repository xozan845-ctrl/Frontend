import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isCompanyOwnerRole } from '../../models/auth.model';
import { AuthStore } from '../../state/auth/auth.store';

/**
 * Evita que el propietario de una empresa activa vuelva a la entrada pública.
 * La ruta raíz sigue disponible para empresarios que aún no tienen tenant, ya
 * que ellos todavía deben completar el onboarding.
 */
export const companyOwnerRedirectGuard: CanActivateFn = async () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated() && authStore.refreshToken()) {
    await authStore.refreshTokenOnce();
  }

  const user = authStore.user();
  if (isCompanyOwnerRole(user?.role) && user?.tenantId) {
    return router.createUrlTree(['/empresa/inicio']);
  }

  return true;
};
