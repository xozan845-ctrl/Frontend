import { Routes } from '@angular/router';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { CART_ROUTES } from './features/cart/cart.routes';
import { HOME_ROUTES } from './features/home/home.routes';
import { PLANS_ROUTES } from './features/plans/plans.routes';
import { PRODUCTS_ROUTES } from './features/products/products.routes';
import { WISHLIST_ROUTES } from './features/wishlist/wishlist.routes';

/**
 * Punto de composición de rutas (`R-AR-2`, `R-AR-12`): cada feature aporta sus
 * rutas con `loadComponent`; aquí solo se componen. Las páginas permanecen
 * lazy (no se importan sus componentes de forma estática).
 */
export const routes: Routes = [
  ...HOME_ROUTES,
  ...PRODUCTS_ROUTES,
  ...CART_ROUTES,
  ...AUTH_ROUTES,
  ...PLANS_ROUTES,
  ...WISHLIST_ROUTES,
  {
    path: '**',
    loadComponent: () => import('./features/home/pages/not-found/not-found.component'),
  },
];
