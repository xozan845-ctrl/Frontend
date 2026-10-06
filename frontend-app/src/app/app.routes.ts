import { Routes } from '@angular/router';
import { authGuard } from './domains/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./domains/home/home.component'),
  },
  {
    path: 'shop',
    loadComponent: () =>
      import('./domains/products/components/product-list/product-list.component'),
  },
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./domains/products/components/product-detail/product-detail.component'),
  },
  {
    path: 'cart',
    redirectTo: 'shop',
  },
  {
    path: 'checkout',
    loadComponent: () => import('./domains/cart/components/checkout/checkout.component'),
    canActivate: [authGuard],
  },
  {
    path: 'checkout/confirmation',
    loadComponent: () => import('./domains/cart/components/confirmation/confirmation.component'),
  },
  {
    path: 'login',
    loadComponent: () => import('./domains/auth/components/login-form/login-form.component'),
  },
  {
    path: 'register',
    loadComponent: () => import('./domains/auth/components/register-form/register-form.component'),
  },
  {
    path: 'plans',
    loadComponent: () => import('./domains/plans/plans.component'),
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./domains/wishlist/wishlist.component'),
  },
  {
    path: '**',
    loadComponent: () => import('./domains/home/not-found.component'),
  },
];
