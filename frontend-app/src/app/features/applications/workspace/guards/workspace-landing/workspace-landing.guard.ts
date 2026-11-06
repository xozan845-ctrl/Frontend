import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore, workspaceLanding } from '../../auth/public-api';

/** Redirige `/app` al contexto del usuario autenticado. */
export const workspaceLandingGuard: CanActivateFn = async () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (!auth.isAuthenticated() && auth.refreshToken()) {
    await auth.refreshTokenOnce();
  }

  const user = auth.user();

  if (!user) return router.parseUrl('/login');
  return router.parseUrl(workspaceLanding(user));
};
