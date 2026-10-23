import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../state/auth/auth.store';

/** Roles con acceso a la logística de campo (espeja `ROLES_LOGISTICA`). */
const FIELD_ROLES: readonly string[] = [
  'super_admin',
  'admin',
  'empresario',
  'logistica',
  'coordinador',
  'supervisor',
  'operativo',
];

export function canViewField(role?: string): boolean {
  return !!role && FIELD_ROLES.includes(role);
}

/**
 * Guard de logística de campo (ADR-39): rutas, paradas, personal e incidencias
 * comparten el tenant activo. Restaura la sesión y conserva la URL intentada.
 */
export const fieldGuard: CanActivateFn = async (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated() && authStore.refreshToken()) {
    await authStore.refreshTokenOnce();
  }

  const user = authStore.user();
  if (canViewField(user?.role)) {
    return true;
  }

  if (!user) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  return router.createUrlTree(['/']);
};
