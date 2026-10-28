import { Routes } from '@angular/router';

/** Home del storefront; se monta como hijo de `/tienda/:storeId` (`R-AR-12`). */
export const HOME_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component'),
  },
];

/** Entrada raíz de la plataforma multi-tienda (sin tienda en la URL). */
export const ROOT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/store-entry/store-entry.component'),
  },
];
