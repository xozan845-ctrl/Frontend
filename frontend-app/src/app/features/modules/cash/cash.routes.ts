import { Routes } from '@angular/router';
import { CashStore } from '../../domains/cash/public-api';

/** Ruta lazy del módulo de caja; el dominio es compartido por empresa. */
export const CASH_ROUTES: Routes = [
  {
    path: '',
    providers: [CashStore],
    loadComponent: () => import('./pages/cash/cash.component'),
  },
];
