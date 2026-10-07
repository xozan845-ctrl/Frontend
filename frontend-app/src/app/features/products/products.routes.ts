import { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: 'shop',
    loadComponent: () => import('./pages/product-list/product-list.component'),
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./pages/product-detail/product-detail.component'),
  },
];
