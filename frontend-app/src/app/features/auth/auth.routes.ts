import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login-form/login-form.component'),
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register-form/register-form.component'),
  },
];
