import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login-form/login-form.component'),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register-form/register-form.component'),
  },
];
