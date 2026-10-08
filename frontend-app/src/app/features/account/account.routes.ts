import { Routes } from '@angular/router';
import { authGuard } from '../auth/guards/auth.guard';

/** Área de cuenta del comprador (`R-AR-12`), fuera del scope de tienda. */
export const ACCOUNT_ROUTES: Routes = [
  {
    path: 'cuenta',
    loadComponent: () => import('./pages/account/account.component'),
    canActivate: [authGuard],
  },
];
