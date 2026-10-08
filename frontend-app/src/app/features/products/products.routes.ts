import { Routes } from '@angular/router';

/**
 * Rutas del storefront de productos, hijas de `/tienda/:storeId` (`R-AR-12`).
 * El catálogo y las ofertas son públicos (`GET /tiendas/:id`), así que no
 * exigen sesión; solo el checkout (crear orden) la requiere.
 */
export const PRODUCTS_ROUTES: Routes = [
  {
    path: 'shop',
    loadComponent: () => import('./pages/product-list/product-list.component'),
  },
  {
    path: 'producto/:id',
    loadComponent: () => import('./pages/product-detail/product-detail.component'),
  },
];
