import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../state/auth/auth.store';

/** Roles que pueden consultar envíos (admin global o empresario de la empresa). */
export function canViewShipments(role?: string): boolean {
  return role === 'admin' || role === 'super_admin' || role === 'empresario';
}

/**
 * Guard de la vista de envíos (ADR-37): admin/super_admin ven todas las guías y
 * el empresario las de su empresa. Restaura la sesión con refresh y conserva la
 * URL intentada.
 */
export const logisticsGuard: CanActivateFn = async (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated() && authStore.refreshToken()) {
    await authStore.refreshTokenOnce();
  }

  const user = authStore.user();
  if (canViewShipments(user?.role)) {
    return true;
  }

  if (!user) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  return router.createUrlTree(['/']);
};
