import { Routes } from '@angular/router';
import { authGuard } from '../auth/guards/auth/auth.guard';
import { AccountOrdersStore } from './state/account-orders/account-orders.store';
import { OrderDetailStore } from './state/order-detail/order-detail.store';

/** Área de cuenta del comprador (`R-AR-12`), fuera del scope de tienda. */
export const ACCOUNT_ROUTES: Routes = [
  {
    path: 'cuenta',
    loadComponent: () => import('./pages/account/account.component'),
    canActivate: [authGuard],
  },
  {
    path: 'cuenta/pedidos',
    loadComponent: () => import('./pages/orders/orders.component'),
    canActivate: [authGuard],
    providers: [AccountOrdersStore],
  },
  {
    path: 'cuenta/pedidos/:id',
    loadComponent: () => import('./pages/order-detail/order-detail.component'),
    canActivate: [authGuard],
    providers: [OrderDetailStore],
  },
];
