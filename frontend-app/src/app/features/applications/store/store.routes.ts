import { Route, Routes } from '@angular/router';
import { STORAGE_ROUTES } from '../storage/public-api';
import { moduleGuard } from '../auth/public-api';
import { commercialScopeRoutes } from '../workspace/constants/commercial.routes';
import {
  CLIENT_REPOSITORY,
  ClientSearchStore,
  ClientService,
  OrderDraftStore,
  VENDOR_OFFER_REPOSITORY,
  VENDOR_ORDER_REPOSITORY,
  VENDOR_ORDERS_SOURCE,
  VENDOR_PRODUCT_REPOSITORY,
  VendorCatalogStore,
  VendorOfferService,
  VendorOffersStore,
  VendorOrderService,
  VendorOrdersStore,
  VendorProductService,
  createVendorOrdersSource,
  type VendorOrderRepository,
} from '../../domains/store-sales/public-api';
import {
  CATALOG_PRODUCT_REPOSITORY,
  CatalogProductService,
} from '../../domains/catalog/public-api';
import { STORE_REPOSITORY, StoreService } from '../onboarding/public-api';
import { CatalogProductsStore } from '../shop/state/catalog-product/catalog-product.store';
import { vendorGuard } from './guards/vendor/vendor.guard';
import { VendorStoreStore } from './state/vendor-store/vendor-store.store';
import { StoreLogoStore } from './state/store-logo/store-logo.store';
import { STORAGE_REPOSITORY, StorageService } from '../storage/public-api';
import { MediaBackgroundUploadService } from '../../domains/media-background/public-api';

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
export const STORE_ROUTES: Routes = [
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
      ...commercialScopeRoutes('store'),
      {
        path: 'facturacion',
        canActivate: [moduleGuard('store.billing')],
        loadChildren: () =>
          import('../billing/billing.routes').then((module) => module.BILLING_PAGE_ROUTES),
      },
      {
        path: 'tienda',
        canActivate: [moduleGuard('store.my-store')],
        loadComponent: () => import('./pages/store/store.component'),
        providers: [
          StoreLogoStore,
          MediaBackgroundUploadService,
          { provide: STORAGE_REPOSITORY, useClass: StorageService },
        ],
      },
      // La administración de empresa no se expone dentro del panel operativo;
      // vive en el workspace de empresa.
      {
        path: 'catalogo',
        canActivate: [moduleGuard('store.catalog')],
        loadComponent: () => import('../shop/pages/catalog/catalog.component'),
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
