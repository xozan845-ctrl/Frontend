import { Routes } from '@angular/router';
import { authGuard } from '../auth/guards/auth.guard';

export const WISHLIST_ROUTES: Routes = [
  {
    path: 'wishlist',
    loadComponent: () => import('./pages/wishlist/wishlist.component'),
    canActivate: [authGuard],
  },
];
