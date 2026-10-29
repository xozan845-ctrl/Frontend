import { Routes } from '@angular/router';
import { ExpensesStore } from '../../domains/expenses/public-api';

/** Ruta lazy del módulo de gastos; el dominio es compartido por empresa. */
export const EXPENSES_ROUTES: Routes = [
  {
    path: '',
    providers: [ExpensesStore],
    loadComponent: () => import('./pages/expenses/expenses.component'),
  },
];
