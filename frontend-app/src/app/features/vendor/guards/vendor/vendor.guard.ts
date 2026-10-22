import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../auth/public-api';
import { canEnterWorkspace, workspaceLanding } from '../../../auth/public-api';

/**
 * Guard del panel del vendedor (ADR-20, ADR-26, `R-SE-6`): exige sesión **y** un
 * rol `vendedor` con empresa y tienda asignadas. La administración de empresa
 * vive en otro workspace y no se expone en este menú. Al recargar una ruta protegida
 * intenta restaurar la sesión con el refresh token antes de decidir (`R-SE-1`);
 * un comprador autenticado vuelve al alta de tienda (puede convertirse en
 * vendedor) y un anónimo a `/login` conservando la URL intentada.
 */
export const vendorGuard: CanActivateFn = async (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated() && authStore.refreshToken()) {
    await authStore.refreshTokenOnce();
  }

  const user = authStore.user();
  if (canEnterWorkspace(user, 'store')) {
    return true;
  }

  if (user) {
    if (user.role === 'comprador' || (user.role === 'vendedor' && !user.storeId)) {
      return router.createUrlTree(['/crear-tienda']);
    }
    return router.createUrlTree([workspaceLanding(user)]);
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
