import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../state/auth.store';

export const authGuard: CanActivateFn = async (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  // Al recargar una ruta protegida el access token aún no está en memoria:
  // restaura la sesión con el refresh token antes de decidir, para no rebotar
  // a /login teniendo una sesión válida (R-SE-1).
  if (authStore.refreshToken()) {
    const renewed = await authStore.refreshTokenOnce();
    if (renewed) return true;
  }

  // Not authenticated: redirect to login preserving the attempted URL so the
  // user returns to the right store after signing in (multi-tienda).
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
