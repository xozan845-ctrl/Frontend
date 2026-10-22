import { Routes } from '@angular/router';
import { adminGuard } from '../auth/public-api';
import { INVENTORY_REPOSITORY } from './repositories/inventory.repository';
import { InventoryService } from './services/inventory/inventory.service';
import { InventoryStore } from './state/inventory/inventory.store';

/**
 * Área de administración (`/admin/**`, ADR-33). Se carga con `loadChildren`
 * desde `app.routes.ts`; el guard exige rol admin/super_admin y el store/puerto
 * se proveen en la ruta lazy (`R-AR-3`, `R-LZ-1`, `R-SE-6`).
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: 'inventario',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/inventory/inventory.component'),
    providers: [InventoryStore, { provide: INVENTORY_REPOSITORY, useClass: InventoryService }],
  },
];
