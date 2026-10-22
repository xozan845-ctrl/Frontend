import { Routes } from '@angular/router';
import { adminGuard } from '../auth/public-api';

import { ADMIN_ORDER_REPOSITORY } from './repositories/admin-order.repository';
import { INVENTORY_REPOSITORY } from './repositories/inventory.repository';
import { AdminOrderService } from './services/admin-order/admin-order.service';
import { InventoryService } from './services/inventory/inventory.service';
import { InventoryStore } from './state/inventory/inventory.store';
import { AdminOrdersStore } from './state/orders/admin-orders.store';

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
  {
    path: 'pedidos',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/orders/orders.component'),
    providers: [AdminOrdersStore, { provide: ADMIN_ORDER_REPOSITORY, useClass: AdminOrderService }],
  },
];
