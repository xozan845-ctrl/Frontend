import { Route, Routes } from '@angular/router';
import { vendorGuard } from './guards/vendor.guard';
import { CLIENT_REPOSITORY } from './repositories/client.repository';
import { VENDOR_ORDER_REPOSITORY } from './repositories/vendor-order.repository';
import { VENDOR_PRODUCT_REPOSITORY } from './repositories/vendor-product.repository';
import { ClientService } from './services/client/client.service';
import { VendorOrderService } from './services/vendor-order/vendor-order.service';
import { VendorProductService } from './services/vendor-product/vendor-product.service';
import { ClientSearchStore } from './state/client-search/client-search.store';
import { OrderDraftStore } from './state/order-draft/order-draft.store';
import { VendorCatalogStore } from './state/vendor-catalog/vendor-catalog.store';
import { VendorOrdersStore } from './state/vendor-orders/vendor-orders.store';

/**
 * Sección aún sin fase: página "En construcción" real (`R-UX-1`) con SEO
 * (`R-UX-6`). La página vive en `shared/ui` porque también la usa logística
 * (`R-SH-3`).
 */
const comingSoonRoute = (title: string, description: string, icon: string): Route => ({
  loadComponent: () => import('../../shared/ui/coming-soon/coming-soon.component'),
  data: { title, description, icon, context: 'Panel del vendedor' },
});

/**
 * Rutas del panel del vendedor (ADR-20, `R-AR-12`, `R-LZ-1`): se cargan con
 * `loadChildren` desde `app.routes.ts` para que ni el POS ni sus stores formen
 * parte del bundle inicial. El guard exige rol `vendedor` (`R-SE-6`) y las
 * secciones sin fase responden con una página "En construcción" (`R-UX-1`) en
 * lugar de enlaces muertos. Los datos de cada sección llegan por `data` con
 * `withComponentInputBinding`. Los stores del POS (borrador, catálogo, clientes
 * y pedidos) se proveen a nivel de shell (`R-AR-5`) para que sobrevivan a la
 * navegación entre secciones y se liberen al salir del panel.
 */
export const VENDOR_ROUTES: Routes = [
  {
    path: '',
    canActivate: [vendorGuard],
    loadComponent: () => import('./pages/vendor-shell/vendor-shell.component'),
    providers: [
      { provide: VENDOR_ORDER_REPOSITORY, useClass: VendorOrderService },
      { provide: CLIENT_REPOSITORY, useClass: ClientService },
      { provide: VENDOR_PRODUCT_REPOSITORY, useClass: VendorProductService },
      OrderDraftStore,
      VendorOrdersStore,
      ClientSearchStore,
      VendorCatalogStore,
    ],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        loadComponent: () => import('./pages/dashboard/dashboard.component'),
      },
      {
        path: 'ventas/nuevo',
        loadComponent: () => import('./pages/new-order/new-order.component'),
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./pages/orders/orders.component'),
      },
      {
        path: 'pedidos/:id',
        loadComponent: () => import('./pages/order-detail/order-detail.component'),
      },
      {
        path: 'clientes',
        loadComponent: () => import('./pages/clients/clients.component'),
      },
      {
        path: 'productos',
        ...comingSoonRoute(
          'Productos',
          'Tu catálogo con precios y existencias.',
          'fa-solid fa-box',
        ),
      },
      {
        path: 'inventario',
        ...comingSoonRoute(
          'Inventario',
          'El control de existencias de tu tienda.',
          'fa-solid fa-warehouse',
        ),
      },
      {
        path: 'reportes',
        ...comingSoonRoute(
          'Reportes',
          'Las métricas de ventas de tu tienda.',
          'fa-solid fa-chart-line',
        ),
      },
      {
        path: 'ajustes',
        ...comingSoonRoute(
          'Ajustes',
          'La configuración de tu cuenta de vendedor.',
          'fa-solid fa-gear',
        ),
      },
      {
        path: 'ayuda',
        ...comingSoonRoute(
          'Ayuda y soporte',
          'Guías y canales de soporte para vendedores.',
          'fa-solid fa-circle-question',
        ),
      },
    ],
  },
];
