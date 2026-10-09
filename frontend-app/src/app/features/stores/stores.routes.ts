import { Routes } from '@angular/router';
import { StoreWizardStore } from './state/store-wizard.store';
import { STORE_REPOSITORY } from './repositories/store.repository';
import { CATALOG_REPOSITORY } from './repositories/catalog.repository';
import { StoreService } from './services/store.service';
import { CatalogService } from './services/catalog.service';

/**
 * Rutas de la tienda del vendedor (`R-AR-12`). `/crear-tienda` es **pública**:
 * el propio asistente gestiona la cuenta (paso 1) y el registro de vendedor.
 *
 * La infraestructura de `stores` (puertos, servicios y `StoreWizardStore`) se
 * provee aquí, en la ruta cargada con `loadChildren`, para que no forme parte
 * del bundle inicial (`R-LZ-1`, `R-PF-1`). `StoreWizardStore` se provee para que
 * cada visita empiece limpia.
 */
export const STORES_ROUTES: Routes = [
  {
    path: 'crear-tienda',
    loadComponent: () => import('./pages/create-store/create-store.component'),
    providers: [
      StoreWizardStore,
      { provide: STORE_REPOSITORY, useClass: StoreService },
      { provide: CATALOG_REPOSITORY, useClass: CatalogService },
    ],
  },
];
