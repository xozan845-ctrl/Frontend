import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../auth/public-api';

/**
 * Guard del panel del vendedor (ADR-20, `R-SE-6`): exige sesión **y** rol
 * `vendedor`. Al recargar una ruta protegida intenta restaurar la sesión con el
 * refresh token antes de decidir (`R-SE-1`); un comprador autenticado vuelve al
 * alta de tienda (puede convertirse en vendedor) y un anónimo a `/login`
 * conservando la URL intentada.
 */
export const vendorGuard: CanActivateFn = async (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated() && authStore.refreshToken()) {
    await authStore.refreshTokenOnce();
  }

  const user = authStore.user();
  if (user?.role === 'vendedor') {
    return true;
  }

  if (user) {
    return router.createUrlTree(['/crear-tienda']);
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
