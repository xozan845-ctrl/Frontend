import { Routes } from '@angular/router';

/** Wishlist del storefront; hija de `/tienda/:storeId` (`R-AR-12`). */
export const WISHLIST_ROUTES: Routes = [
  {
    path: 'wishlist',
    loadComponent: () => import('./pages/wishlist/wishlist.component'),
  },
];
