import { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: 'shop',
    loadComponent: () => import('./components/product-list/product-list.component'),
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./components/product-detail/product-detail.component'),
  },
];
