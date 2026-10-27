import { Route, Routes } from '@angular/router';
import {
  CATALOG_PRODUCT_REPOSITORY,
  CatalogProductService,
  CatalogProductsStore,
} from '../products/public-api';
import { companyGuard } from './guards/company/company.guard';
import { COMPANY_PORTAL_REPOSITORY } from './repositories/company-portal.repository';
import { COMPANY_REPOSITORY } from './repositories/company.repository';
import { CompanyPortalService } from './services/company-portal/company-portal.service';
import { CompanyService } from './services/company/company.service';
import { CompanyPortalStore } from './state/company-portal/company-portal.store';
import { CompanyServicesStore } from './state/company-services/company-services.store';
import { CompanyStore } from './state/company/company.store';

const companySoonRoute = (
  path: string,
  title: string,
  description: string,
  icon: string,
): Route => ({
  path,
  loadComponent: () => import('../../shared/ui/coming-soon/coming-soon.component'),
  data: { title, description, icon, context: 'Empresa' },
});

/** Rutas del workspace del propietario (`R-AR-12`, `R-SE-6`). */
export const EMPRESAS_ROUTES: Routes = [
  {
    path: 'registro/vendedor',
    loadChildren: () =>
      import('./seller-invitation.routes').then((module) => module.SELLER_INVITATION_ROUTES),
  },
  {
    path: 'empresa',
    canActivate: [companyGuard],
    loadComponent: () => import('./pages/company-shell/company-shell.component'),
    providers: [CompanyStore, { provide: COMPANY_REPOSITORY, useClass: CompanyService }],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        loadComponent: () => import('./pages/company-settings/company-settings.component'),
      },
      {
        path: 'ventas',
        loadComponent: () => import('./pages/company-orders/company-orders.component'),
        providers: [
          CompanyPortalStore,
          { provide: COMPANY_PORTAL_REPOSITORY, useClass: CompanyPortalService },
        ],
      },
      {
        path: 'clientes',
        loadChildren: () =>
          import('./pages/company-clients/company-clients.routes').then(
            (module) => module.COMPANY_CLIENTS_ROUTES,
          ),
      },
      {
        path: 'productos',
        loadComponent: () => import('./pages/company-products/company-products.component'),
        providers: [
          CatalogProductsStore,
          CompanyServicesStore,
          { provide: CATALOG_PRODUCT_REPOSITORY, useClass: CatalogProductService },
        ],
      },
      companySoonRoute(
        'compras',
        'Compras',
        'Órdenes y proveedores de la empresa.',
        'fa-solid fa-bag-shopping',
      ),
      companySoonRoute(
        'gastos',
        'Gastos',
        'Control de gastos operativos.',
        'fa-solid fa-dollar-sign',
      ),
      companySoonRoute(
        'caja',
        'Caja / Pagos',
        'Movimientos y cierres de caja.',
        'fa-solid fa-wallet',
      ),
      companySoonRoute(
        'cuentas-por-pagar',
        'Cuentas por pagar',
        'Compromisos y vencimientos de pago.',
        'fa-solid fa-file-invoice-dollar',
      ),
      companySoonRoute('salarios', 'Salarios', 'Nómina y pagos al equipo.', 'fa-solid fa-users'),
      companySoonRoute(
        'proformas',
        'Proformas',
        'Cotizaciones y proformas comerciales.',
        'fa-solid fa-file-lines',
      ),
      companySoonRoute(
        'codigos-de-barras',
        'Códigos de barras',
        'Etiquetas y códigos para tus productos.',
        'fa-solid fa-barcode',
      ),
      companySoonRoute(
        'creditos',
        'Créditos',
        'Crédito de clientes y cuentas financiadas.',
        'fa-solid fa-credit-card',
      ),
      companySoonRoute(
        'impuestos',
        'Impuestos',
        'Configuración y reportes fiscales.',
        'fa-solid fa-file-invoice',
      ),
      companySoonRoute(
        'reportes',
        'Reportes',
        'Reportes consolidados por tienda.',
        'fa-solid fa-chart-column',
      ),
      companySoonRoute(
        'estadisticas',
        'Estadísticas',
        'Indicadores y tendencias del negocio.',
        'fa-solid fa-wave-square',
      ),
      companySoonRoute(
        'notificaciones',
        'Notificaciones',
        'Alertas relevantes de tu empresa.',
        'fa-solid fa-bell',
      ),
      {
        path: 'tiendas',
        loadComponent: () => import('./pages/company-stores/company-stores.component'),
        providers: [
          CompanyPortalStore,
          { provide: COMPANY_PORTAL_REPOSITORY, useClass: CompanyPortalService },
        ],
      },
      {
        path: 'vendedores',
        loadChildren: () =>
          import('./company-vendors.routes').then((module) => module.COMPANY_VENDORS_ROUTES),
      },
      {
        path: 'logistica',
        loadChildren: () =>
          import('../logistica/logistica.routes').then((module) => module.LOGISTICA_ROUTES),
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./pages/company-settings/company-settings.component'),
      },
      companySoonRoute(
        'ayuda',
        'Ayuda y soporte',
        'Guías y canales de soporte para tu empresa.',
        'fa-solid fa-circle-question',
      ),
    ],
  },
];
