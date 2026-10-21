import { Routes } from '@angular/router';
import { ACCOUNT_ROUTES } from './features/account/account.routes';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { CART_ROUTES } from './features/cart/cart.routes';
import { HOME_ROUTES, ROOT_ROUTES } from './features/home/home.routes';
import { PLANS_ROUTES } from './features/plans/plans.routes';
import { PRODUCTS_ROUTES } from './features/products/products.routes';
import { WISHLIST_ROUTES } from './features/wishlist/wishlist.routes';
import { storefrontResolver } from './features/products/resolvers/storefront/storefront.resolver';

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
  // La entrada raíz (`/`) debe ir **antes** que las rutas lazy con path vacío:
  // si no, `stores` captura la URL vacía con un match sin componente (el outlet
  // queda en blanco, sin error) y `ROOT_ROUTES` nunca se llega a evaluar.
  ...ROOT_ROUTES,
  {
    // `stores` se carga con `loadChildren` para no arrastrar su infraestructura
    // (puertos, servicios y store del asistente) al bundle inicial (R-LZ-1, R-PF-1).
    path: '',
    loadChildren: () => import('./features/stores/stores.routes').then((m) => m.STORES_ROUTES),
  },
  {
    // Feature de scraping con IA: backend independiente (`ai_scraper_executor`).
    // Se carga lazy con `loadChildren` (R-LZ-1, R-PF-1).
    path: 'ia',
    loadChildren: () =>
      import('./features/ai-scraper/ai-scraper.routes').then((m) => m.AI_SCRAPER_ROUTES),
  },
  {
    // Panel del vendedor (ADR-20): POS con pedidos en tiempo real. Se carga lazy
    // con `loadChildren` para que ni sus stores ni el POS viajen en el bundle
    // inicial (R-LZ-1, R-PF-1).
    path: 'vendedor',
    loadChildren: () => import('./features/vendor/vendor.routes').then((m) => m.VENDOR_ROUTES),
  },
  {
    // Facturación (ADR-23): extensión visual del panel del vendedor. Se carga
    // lazy para no arrastrar sus páginas al bundle inicial (R-LZ-1, R-PF-1).
    path: 'facturacion',
    loadChildren: () => import('./features/billing/billing.routes').then((m) => m.BILLING_ROUTES),
  },
  {
    // Logística (ADR-25): tablero visual de rutas y entregas. Se carga lazy
    // para que el mapa (Leaflet) y sus paneles no viajen en el bundle inicial
    // (R-LZ-1, R-PF-1).
    path: 'logistica',
    loadChildren: () =>
      import('./features/logistica/logistica.routes').then((m) => m.LOGISTICA_ROUTES),
  },
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
