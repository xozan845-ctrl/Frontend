import { Routes } from '@angular/router';
import { authGuard } from '../auth/guards/auth.guard';

/** Rutas del carrito, hijas de `/tienda/:storeId` (`R-AR-12`). */
export const CART_ROUTES: Routes = [
  {
    path: 'carrito',
    loadComponent: () => import('./pages/cart-view/cart-view.component'),
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.component'),
    canActivate: [authGuard],
  },
  {
    path: 'checkout/confirmacion',
    loadComponent: () => import('./pages/confirmation/confirmation.component'),
  },
];
