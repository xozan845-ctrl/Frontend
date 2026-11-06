import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore, workspaceLanding } from '../../auth/public-api';

/** Redirige `/app` al contexto del usuario autenticado. */
export const workspaceLandingGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const user = auth.user();

  if (!user) return router.parseUrl('/login');
  return router.parseUrl(workspaceLanding(user));
};
