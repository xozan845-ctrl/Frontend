import { Route, Routes } from '@angular/router';
import { moduleGuard } from '../auth/public-api';
import { commercialScopeRoutes } from '../workspace/constants/commercial.routes';
import { companyGuard } from './guards/company/company.guard';
import { COMPANY_PORTAL_REPOSITORY } from './repositories/company-portal.repository';
import { CompanyPortalService } from './services/company-portal/company-portal.service';
import { CompanyPortalStore } from './state/company-portal/company-portal.store';

const companySoonRoute = (
  path: string,
  title: string,
  description: string,
  icon: string,
  moduleId: string,
): Route => ({
  path,
  canActivate: [moduleGuard(moduleId)],
  loadComponent: () => import('../../../shared/ui/coming-soon/coming-soon.component'),
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
    // Enlace corto para compartir: `/i/<token>`. La ruta anterior se mantiene
    // para no romper invitaciones ya enviadas.
    path: 'i/:token',
    loadChildren: () =>
      import('./seller-invitation.routes').then((module) => module.SELLER_INVITATION_ROUTES),
  },
  {
    path: 'empresa',
    canActivate: [companyGuard],
    loadComponent: () => import('./pages/company-shell/company-shell.component'),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        canActivate: [moduleGuard('company.dashboard')],
        loadComponent: () => import('./pages/company-settings/company-settings.component'),
      },
      {
        path: 'ventas',
        canActivate: [moduleGuard('company.sales')],
        loadChildren: () =>
          import('../../modules/sales/sales.routes').then((module) => module.SALES_ROUTES),
      },
      ...commercialScopeRoutes('company'),
      {
        path: 'productos',
        canActivate: [moduleGuard('company.catalog')],
        loadChildren: () =>
          import('../../modules/catalog/catalog.routes').then((module) => module.CATALOG_ROUTES),
      },
      {
        path: 'compras',
        canActivate: [moduleGuard('company.purchases')],
        loadChildren: () =>
          import('../../modules/purchases/purchases.routes').then(
            (module) => module.PURCHASES_ROUTES,
          ),
      },
      {
        path: 'gastos',
        canActivate: [moduleGuard('company.expenses')],
        loadChildren: () =>
          import('../../modules/expenses/expenses.routes').then((module) => module.EXPENSES_ROUTES),
      },
      {
        path: 'caja',
        canActivate: [moduleGuard('company.cash')],
        loadChildren: () =>
          import('../../modules/finance/finance.routes').then((module) => module.CASH_ROUTES),
      },
      companySoonRoute(
        'salarios',
        'Salarios',
        'Nómina y pagos al equipo.',
        'fa-solid fa-users',
        'company.payroll',
      ),
      companySoonRoute(
        'proformas',
        'Proformas',
        'Cotizaciones y proformas comerciales.',
        'fa-solid fa-file-lines',
        'company.quotes',
      ),
      companySoonRoute(
        'impuestos',
        'Impuestos',
        'Configuración y reportes fiscales.',
        'fa-solid fa-file-invoice',
        'company.taxes',
      ),
      companySoonRoute(
        'estadisticas',
        'Estadísticas',
        'Indicadores y tendencias del negocio.',
        'fa-solid fa-wave-square',
        'company.analytics',
      ),
      companySoonRoute(
        'notificaciones',
        'Notificaciones',
        'Alertas relevantes de tu empresa.',
        'fa-solid fa-bell',
        'company.notifications',
      ),
      {
        path: 'tiendas',
        canActivate: [moduleGuard('company.stores')],
        loadComponent: () => import('./pages/company-stores/company-stores.component'),
        providers: [
          CompanyPortalStore,
          { provide: COMPANY_PORTAL_REPOSITORY, useClass: CompanyPortalService },
        ],
      },
      {
        path: 'vendedores',
        canActivate: [moduleGuard('company.sellers')],
        loadChildren: () =>
          import('./company-vendors.routes').then((module) => module.COMPANY_VENDORS_ROUTES),
      },
      {
        path: 'logistica',
        canActivate: [moduleGuard('company.logistics')],
        loadChildren: () =>
          import('../logistica/logistica.routes').then((module) => module.LOGISTICA_ROUTES),
      },
      {
        path: 'configuracion',
        canActivate: [moduleGuard('company.settings')],
        loadComponent: () => import('./pages/company-settings/company-settings.component'),
      },
      companySoonRoute(
        'ayuda',
        'Ayuda y soporte',
        'Guías y canales de soporte para tu empresa.',
        'fa-solid fa-circle-question',
        'company.help',
      ),
    ],
  },
];
