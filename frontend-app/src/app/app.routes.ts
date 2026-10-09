import { Routes } from '@angular/router';
import { ACCOUNT_ROUTES } from './features/account/account.routes';
import { STORES_ROUTES } from './features/stores/stores.routes';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { CART_ROUTES } from './features/cart/cart.routes';
import { HOME_ROUTES, ROOT_ROUTES } from './features/home/home.routes';
import { PLANS_ROUTES } from './features/plans/plans.routes';
import { PRODUCTS_ROUTES } from './features/products/products.routes';
import { WISHLIST_ROUTES } from './features/wishlist/wishlist.routes';
import { storefrontResolver } from './features/products/resolvers/storefront.resolver';

/**
 * Punto de composición de rutas (`R-AR-2`, `R-AR-12`): cada feature aporta sus
 * rutas con `loadComponent`; aquí solo se componen. Las páginas permanecen
 * lazy (no se importan sus componentes de forma estática).
 *
 * El storefront es **multi-tienda**: todas sus páginas viven bajo
 * `/tienda/:storeId`, y `storefrontResolver` carga la tienda de la URL antes de
 * activarlas. No hay tienda por defecto (Core Engine no expone un directorio).
 */
export const routes: Routes = [
  ...AUTH_ROUTES,
  ...PLANS_ROUTES,
  ...ACCOUNT_ROUTES,
  ...STORES_ROUTES,
  ...ROOT_ROUTES,
  {
    path: 'tienda/:storeId',
    resolve: { storefront: storefrontResolver },
    children: [...HOME_ROUTES, ...PRODUCTS_ROUTES, ...CART_ROUTES, ...WISHLIST_ROUTES],
  },
  {
    path: '**',
    loadComponent: () => import('./features/home/pages/not-found/not-found.component'),
  },
];
