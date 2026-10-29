import { Route, Routes } from '@angular/router';
import {
  CLIENTS_PAGE_CONFIG,
  CLIENTS_SCOPE_CONFIG,
} from '../../../shared/clients/constants/clients-config.tokens';
import { moduleGuard } from '../auth/public-api';
import { companyGuard } from './guards/company/company.guard';
import {
  COMPANY_CLIENTS_PAGE_CONFIG,
  COMPANY_CLIENTS_SCOPE_CONFIG,
} from './constants/company-clients-page.config';
import { COMPANY_PORTAL_REPOSITORY } from './repositories/company-portal.repository';
import { COMPANY_REPOSITORY } from './repositories/company.repository';
import { CompanyPortalService } from './services/company-portal/company-portal.service';
import { CompanyService } from './services/company/company.service';
import { CompanyPortalStore } from './state/company-portal/company-portal.store';
import { COMPANY_PAYABLES_SCOPE_CONFIG } from './constants/company-payables.config';
import { COMPANY_BANKS_SCOPE_CONFIG } from './constants/company-banks.config';
import { COMPANY_BARCODES_SCOPE_CONFIG } from './constants/company-barcodes.config';
import { COMPANY_CREDITS_SCOPE_CONFIG } from './constants/company-credits.config';
import { PAYABLES_SCOPE_CONFIG } from '../../../shared/payables/constants/payables-config.tokens';
import { BANKS_SCOPE_CONFIG } from '../../../shared/banks/constants/banks-config.tokens';
import { BARCODES_SCOPE_CONFIG } from '../../../shared/barcodes/constants/barcodes-config.tokens';
import { CREDITS_SCOPE_CONFIG } from '../../../shared/credits/constants/credits-config.tokens';
import { CompanyStore } from './state/company/company.store';

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
    providers: [CompanyStore, { provide: COMPANY_REPOSITORY, useClass: CompanyService }],
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
      {
        path: 'clientes',
        canActivate: [moduleGuard('company.clients')],
        loadChildren: () =>
          import('../../modules/clients/clients.routes').then((module) => module.CLIENTS_ROUTES),
        providers: [
          { provide: CLIENTS_PAGE_CONFIG, useValue: COMPANY_CLIENTS_PAGE_CONFIG },
          { provide: CLIENTS_SCOPE_CONFIG, useValue: COMPANY_CLIENTS_SCOPE_CONFIG },
        ],
      },
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
      {
        path: 'bancos',
        canActivate: [moduleGuard('company.banks')],
        loadChildren: () =>
          import('../../modules/banks/banks.routes').then((module) => module.BANKS_ROUTES),
        providers: [{ provide: BANKS_SCOPE_CONFIG, useValue: COMPANY_BANKS_SCOPE_CONFIG }],
      },
      {
        path: 'cuentas-por-pagar',
        canActivate: [moduleGuard('company.payables')],
        loadChildren: () =>
          import('../../modules/payables/payables.routes').then((module) => module.PAYABLES_ROUTES),
        providers: [{ provide: PAYABLES_SCOPE_CONFIG, useValue: COMPANY_PAYABLES_SCOPE_CONFIG }],
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
      {
        path: 'codigos-de-barras',
        canActivate: [moduleGuard('company.barcodes')],
        loadChildren: () =>
          import('../../modules/barcodes/barcodes.routes').then((module) => module.BARCODES_ROUTES),
        providers: [{ provide: BARCODES_SCOPE_CONFIG, useValue: COMPANY_BARCODES_SCOPE_CONFIG }],
      },
      {
        path: 'creditos',
        canActivate: [moduleGuard('company.credit')],
        loadChildren: () =>
          import('../../modules/credits/credits.routes').then((module) => module.CREDITS_ROUTES),
        providers: [{ provide: CREDITS_SCOPE_CONFIG, useValue: COMPANY_CREDITS_SCOPE_CONFIG }],
      },
      companySoonRoute(
        'impuestos',
        'Impuestos',
        'Configuración y reportes fiscales.',
        'fa-solid fa-file-invoice',
        'company.taxes',
      ),
      {
        path: 'reportes',
        canActivate: [moduleGuard('company.reports')],
        loadChildren: () =>
          import('../../modules/reports/reports.routes').then(
            (module) => module.COMPANY_REPORTS_ROUTES,
          ),
      },
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
