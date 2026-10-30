import { Route, Routes } from '@angular/router';
import { STORAGE_ROUTES } from '../storage/public-api';
import { moduleGuard } from '../auth/public-api';
import {
  CLIENTS_PAGE_CONFIG,
  CLIENTS_SCOPE_CONFIG,
} from '../../../shared/clients/constants/clients-config.tokens';
import { CATALOG_PRODUCT_REPOSITORY } from '../products/repositories/catalog-product.repository';
import { CatalogProductService } from '../products/services/catalog-product/catalog-product.service';
import { CatalogProductsStore } from '../products/state/catalog-product/catalog-product.store';
import { STORE_REPOSITORY, StoreService } from '../stores/public-api';
import {
  VENDOR_CLIENTS_PAGE_CONFIG,
  VENDOR_CLIENTS_SCOPE_CONFIG,
} from './constants/vendor-clients-page.config';
import { vendorGuard } from './guards/vendor/vendor.guard';
import { VENDOR_PAYABLES_SCOPE_CONFIG } from './constants/vendor-payables.config';
import { VENDOR_BANKS_SCOPE_CONFIG } from './constants/vendor-banks.config';
import { VENDOR_BARCODES_SCOPE_CONFIG } from './constants/vendor-barcodes.config';
import { VENDOR_CREDITS_SCOPE_CONFIG } from './constants/vendor-credits.config';
import { PAYABLES_SCOPE_CONFIG } from '../../../shared/payables/constants/payables-config.tokens';
import { BANKS_SCOPE_CONFIG } from '../../../shared/banks/constants/banks-config.tokens';
import { BARCODES_SCOPE_CONFIG } from '../../../shared/barcodes/constants/barcodes-config.tokens';
import { CREDITS_SCOPE_CONFIG } from '../../../shared/credits/constants/credits-config.tokens';
import { createVendorOrdersSource } from './services/vendor-orders-source/vendor-orders-source.service';
import { CLIENT_REPOSITORY } from './repositories/client.repository';
import { VENDOR_OFFER_REPOSITORY } from './repositories/vendor-offer.repository';
import {
  VENDOR_ORDER_REPOSITORY,
  VENDOR_ORDERS_SOURCE,
  type VendorOrderRepository,
} from './repositories/vendor-order.repository';
import { VENDOR_PRODUCT_REPOSITORY } from './repositories/vendor-product.repository';
import { ClientService } from './services/client/client.service';
import { VendorOfferService } from './services/vendor-offer/vendor-offer.service';
import { VendorOrderService } from './services/vendor-order/vendor-order.service';
import { VendorProductService } from './services/vendor-product/vendor-product.service';
import { ClientSearchStore } from './state/client-search/client-search.store';
import { OrderDraftStore } from './state/order-draft/order-draft.store';
import { VendorCatalogStore } from './state/vendor-catalog/vendor-catalog.store';
import { VendorOffersStore } from './state/vendor-offers/vendor-offers.store';
import { VendorOrdersStore } from './state/vendor-orders/vendor-orders.store';
import { VendorStoreStore } from './state/vendor-store/vendor-store.store';

/**
 * Sección aún sin fase: página "En construcción" real (`R-UX-1`) con SEO
 * (`R-UX-6`). La página vive en `shared/ui` porque también la usa logística
 * (`R-SH-3`).
 */
const comingSoonRoute = (
  title: string,
  description: string,
  icon: string,
  moduleId: string,
): Route => ({
  canActivate: [moduleGuard(moduleId)],
  loadComponent: () => import('../../../shared/ui/coming-soon/coming-soon.component'),
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
      {
        provide: VENDOR_ORDERS_SOURCE,
        useFactory: (repository: VendorOrderRepository) => createVendorOrdersSource(repository),
        deps: [VENDOR_ORDER_REPOSITORY],
      },
      { provide: CLIENT_REPOSITORY, useClass: ClientService },
      { provide: VENDOR_PRODUCT_REPOSITORY, useClass: VendorProductService },
      { provide: STORE_REPOSITORY, useClass: StoreService },
      VendorStoreStore,
      OrderDraftStore,
      VendorOrdersStore,
      ClientSearchStore,
      VendorCatalogStore,
    ],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        canActivate: [moduleGuard('store.home')],
        loadComponent: () => import('./pages/dashboard/dashboard.component'),
      },
      {
        path: 'ventas/nuevo',
        canActivate: [moduleGuard('store.sales')],
        loadComponent: () => import('../../modules/sales/pages/new-order/new-order.component'),
      },
      {
        path: 'pedidos',
        canActivate: [moduleGuard('store.orders')],
        loadComponent: () => import('../../modules/sales/pages/orders/orders.component'),
      },
      {
        path: 'pedidos/:id',
        canActivate: [moduleGuard('store.orders')],
        loadComponent: () =>
          import('../../modules/sales/pages/order-detail/order-detail.component'),
      },
      {
        path: 'creditos',
        canActivate: [moduleGuard('store.credit')],
        loadChildren: () =>
          import('../../modules/credits/credits.routes').then((module) => module.CREDITS_ROUTES),
        providers: [{ provide: CREDITS_SCOPE_CONFIG, useValue: VENDOR_CREDITS_SCOPE_CONFIG }],
      },
      {
        path: 'codigos-de-barras',
        canActivate: [moduleGuard('store.barcodes')],
        loadChildren: () =>
          import('../../modules/barcodes/barcodes.routes').then((module) => module.BARCODES_ROUTES),
        providers: [{ provide: BARCODES_SCOPE_CONFIG, useValue: VENDOR_BARCODES_SCOPE_CONFIG }],
      },
      {
        path: 'bancos',
        canActivate: [moduleGuard('store.banks')],
        loadChildren: () =>
          import('../../modules/banks/banks.routes').then((module) => module.BANKS_ROUTES),
        providers: [{ provide: BANKS_SCOPE_CONFIG, useValue: VENDOR_BANKS_SCOPE_CONFIG }],
      },
      {
        path: 'cuentas-por-pagar',
        canActivate: [moduleGuard('store.payables')],
        loadChildren: () =>
          import('../../modules/payables/payables.routes').then((module) => module.PAYABLES_ROUTES),
        providers: [{ provide: PAYABLES_SCOPE_CONFIG, useValue: VENDOR_PAYABLES_SCOPE_CONFIG }],
      },
      {
        path: 'tienda',
        canActivate: [moduleGuard('store.my-store')],
        loadComponent: () => import('./pages/store/store.component'),
      },
      // Compatibilidad con enlaces antiguos: la administración vive en su
      // workspace propio, fuera del panel operativo.
      { path: 'empresa', pathMatch: 'full', redirectTo: '/empresa' },
      {
        path: 'clientes',
        canActivate: [moduleGuard('store.clients')],
        loadChildren: () =>
          import('../../modules/clients/clients.routes').then((module) => module.CLIENTS_ROUTES),
        providers: [
          { provide: CLIENTS_PAGE_CONFIG, useValue: VENDOR_CLIENTS_PAGE_CONFIG },
          { provide: CLIENTS_SCOPE_CONFIG, useValue: VENDOR_CLIENTS_SCOPE_CONFIG },
        ],
      },
      {
        path: 'catalogo',
        canActivate: [moduleGuard('store.catalog')],
        loadComponent: () => import('../products/pages/catalog/catalog.component'),
        providers: [
          CatalogProductsStore,
          { provide: CATALOG_PRODUCT_REPOSITORY, useClass: CatalogProductService },
        ],
      },
      {
        path: 'productos',
        canActivate: [moduleGuard('store.offers')],
        loadComponent: () => import('./pages/products/products.component'),
        providers: [
          VendorOffersStore,
          { provide: VENDOR_OFFER_REPOSITORY, useClass: VendorOfferService },
        ],
      },
      {
        path: 'inventario',
        ...comingSoonRoute(
          'Inventario',
          'El control de existencias de tu tienda.',
          'fa-solid fa-warehouse',
          'store.inventory',
        ),
      },
      ...STORAGE_ROUTES,
      {
        path: 'reportes',
        canActivate: [moduleGuard('store.reports')],
        loadChildren: () =>
          import('../../modules/reports/reports.routes').then(
            (module) => module.VENDOR_REPORTS_ROUTES,
          ),
      },
      {
        path: 'ajustes',
        ...comingSoonRoute(
          'Ajustes',
          'La configuración de tu cuenta de vendedor.',
          'fa-solid fa-gear',
          'store.settings',
        ),
      },
      {
        path: 'roles',
        canActivate: [moduleGuard('store.roles')],
        loadComponent: () => import('../../../shared/ui/coming-soon/coming-soon.component'),
        data: {
          title: 'Roles y permisos',
          description: 'Crea roles y asigna permisos dentro de tu tienda.',
          icon: 'fa-solid fa-user-shield',
          context: 'Tienda',
          workspace: 'store',
          permission: 'store:manage-roles',
        },
      },
      {
        path: 'ayuda',
        ...comingSoonRoute(
          'Ayuda y soporte',
          'Guías y canales de soporte para vendedores.',
          'fa-solid fa-circle-question',
          'store.help',
        ),
      },
      {
        path: 'logistica',
        canActivate: [moduleGuard('store.logistics')],
        loadChildren: () =>
          import('../logistica/logistica.routes').then((module) => module.LOGISTICA_ROUTES),
      },
    ],
  },
];
