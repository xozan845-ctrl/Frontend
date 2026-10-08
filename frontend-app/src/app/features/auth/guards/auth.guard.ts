import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../state/auth.store';

export const authGuard: CanActivateFn = (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  // Not authenticated: redirect to login preserving the attempted URL so the
  // user returns to the right store after signing in (multi-tienda).
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
