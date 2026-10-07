import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../state/auth.store';

export const authGuard: CanActivateFn = (_route, _state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  // Not authenticated, redirect to login without adding expected console noise.
  router.navigate(['/login']);
  return false;
};
