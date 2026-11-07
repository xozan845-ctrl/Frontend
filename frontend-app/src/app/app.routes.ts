import { Routes } from '@angular/router';
import { ACCOUNT_ROUTES } from './features/applications/account/account.routes';
import { AUTH_ROUTES } from './features/applications/auth/auth.routes';
import { CART_ROUTES } from './features/applications/cart/cart.routes';
import { HOME_ROUTES, ROOT_ROUTES } from './features/applications/home/home.routes';
import { PLANS_ROUTES } from './features/applications/plans/plans.routes';
import { SHOP_ROUTES } from './features/applications/shop/shop.routes';
import { WISHLIST_ROUTES } from './features/applications/wishlist/wishlist.routes';
import { COMPANY_INVITATION_ROUTES } from './features/applications/company/company.routes';
import { storefrontResolver } from './features/applications/shop/resolvers/storefront/storefront.resolver';

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
  ...COMPANY_INVITATION_ROUTES,
  // La entrada raíz (`/`) debe ir **antes** que las rutas lazy con path vacío:
  // si no, `stores` captura la URL vacía con un match sin componente (el outlet
  // queda en blanco, sin error) y `ROOT_ROUTES` nunca se llega a evaluar.
  ...ROOT_ROUTES,
  {
    // `stores` se carga con `loadChildren` para no arrastrar su infraestructura
    // (puertos, servicios y store del asistente) al bundle inicial (R-LZ-1, R-PF-1).
    path: '',
    loadChildren: () =>
      import('./features/applications/onboarding/onboarding.routes').then(
        (m) => m.ONBOARDING_ROUTES,
      ),
  },
  {
    // Feature de scraping con IA: backend independiente (`ai_scraper_executor`).
    // Se carga lazy con `loadChildren` (R-LZ-1, R-PF-1).
    path: 'ia',
    loadChildren: () =>
      import('./features/applications/ai-scraper/ai-scraper.routes').then(
        (m) => m.AI_SCRAPER_ROUTES,
      ),
  },
  {
    path: 'app',
    loadChildren: () =>
      import('./features/applications/workspace/workspace.routes').then(
        (module) => module.WORKSPACE_ROUTES,
      ),
  },
  {
    path: 'tienda/:storeId',
    resolve: { storefront: storefrontResolver },
    children: [...HOME_ROUTES, ...SHOP_ROUTES, ...CART_ROUTES, ...WISHLIST_ROUTES],
  },
  {
    path: '**',
    loadComponent: () => import('./features/applications/home/pages/not-found/not-found.component'),
  },
];
