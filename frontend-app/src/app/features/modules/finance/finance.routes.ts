import { Route, Routes } from '@angular/router';
import { FinanceStore, type FinanceTab } from '../../finance/public-api';

function financeRoute(tab: FinanceTab): Route {
  return {
    path: '',
    providers: [FinanceStore],
    data: { tab },
    loadComponent: () => import('./pages/finance/finance.component'),
  };
}

/** Rutas del módulo de finanzas; cada workspace link conserva su URL. */
export const PURCHASES_ROUTES: Routes = [financeRoute('purchases')];
export const EXPENSES_ROUTES: Routes = [financeRoute('expenses')];
export const CASH_ROUTES: Routes = [financeRoute('cash')];
