import { Routes } from '@angular/router';
import { authGuard } from '../auth/guards/auth.guard';

export const CART_ROUTES: Routes = [
  {
    path: 'cart',
    redirectTo: 'shop',
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.component'),
    canActivate: [authGuard],
  },
  {
    path: 'checkout/confirmation',
    loadComponent: () => import('./pages/confirmation/confirmation.component'),
  },
];
