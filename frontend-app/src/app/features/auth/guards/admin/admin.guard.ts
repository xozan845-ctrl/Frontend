import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../state/auth/auth.store';

/** Indica si el rol puede acceder al área de administración. */
export function isAdminRole(role?: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Guard del área admin (`R-SE-6`, ADR-33): exige sesión y rol `admin` o
 * `super_admin`. Al recargar intenta restaurar la sesión con el refresh token;
 * un usuario sin sesión vuelve a `/login` conservando la URL y un rol distinto
 * vuelve al inicio.
 */
export const adminGuard: CanActivateFn = async (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated() && authStore.refreshToken()) {
    await authStore.refreshTokenOnce();
  }

  const user = authStore.user();
  if (isAdminRole(user?.role)) {
    return true;
  }

  if (!user) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  return router.createUrlTree(['/']);
};
