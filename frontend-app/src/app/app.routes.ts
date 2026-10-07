import { Routes } from '@angular/router';
import { authGuard } from './features/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component'),
  },
  {
    path: 'shop',
    loadComponent: () =>
      import('./features/products/components/product-list/product-list.component'),
  },
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./features/products/components/product-detail/product-detail.component'),
  },
  {
    path: 'cart',
    redirectTo: 'shop',
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/cart/components/checkout/checkout.component'),
    canActivate: [authGuard],
  },
  {
    path: 'checkout/confirmation',
    loadComponent: () => import('./features/cart/components/confirmation/confirmation.component'),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login-form/login-form.component'),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/components/register-form/register-form.component'),
  },
  {
    path: 'plans',
    loadComponent: () => import('./features/plans/plans.component'),
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./features/wishlist/wishlist.component'),
  },
  {
    path: '**',
    loadComponent: () => import('./features/home/not-found.component'),
  },
];
