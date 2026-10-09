import { Routes } from '@angular/router';
import { StoreWizardStore } from './state/store-wizard.store';

/**
 * Rutas de la tienda del vendedor (`R-AR-12`). `/crear-tienda` es **pública**:
 * el propio asistente gestiona la cuenta (paso 1) y el registro de vendedor.
 * `StoreWizardStore` se provee en la ruta para que cada visita empiece limpia.
 */
export const STORES_ROUTES: Routes = [
  {
    path: 'crear-tienda',
    loadComponent: () => import('./pages/create-store/create-store.component'),
    providers: [StoreWizardStore],
  },
];
