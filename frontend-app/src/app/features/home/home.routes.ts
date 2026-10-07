import { Routes } from '@angular/router';
import { authGuard } from '../auth/guards/auth.guard';

export const HOME_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component'),
    canActivate: [authGuard],
  },
];
