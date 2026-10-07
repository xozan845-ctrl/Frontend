import { Routes } from '@angular/router';
import { authGuard } from '../auth/guards/auth.guard';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: 'shop',
    loadComponent: () => import('./pages/product-list/product-list.component'),
    canActivate: [authGuard],
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./pages/product-detail/product-detail.component'),
    canActivate: [authGuard],
  },
];
