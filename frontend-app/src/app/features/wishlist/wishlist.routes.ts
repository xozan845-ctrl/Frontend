import { Routes } from '@angular/router';

export const WISHLIST_ROUTES: Routes = [
  {
    path: 'wishlist',
    loadComponent: () => import('./wishlist.component'),
  },
];
