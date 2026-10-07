import { Routes } from '@angular/router';

export const PLANS_ROUTES: Routes = [
  {
    path: 'plans',
    loadComponent: () => import('./plans.component'),
  },
];
