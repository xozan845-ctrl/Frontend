import { Routes } from '@angular/router';

export const WISHLIST_ROUTES: Routes = [
  {
    path: 'wishlist',
    loadComponent: () => import('./pages/wishlist/wishlist.component'),
  },
];
