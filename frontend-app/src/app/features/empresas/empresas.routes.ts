import { Route, Routes } from '@angular/router';
import { companyGuard } from './guards/company/company.guard';
import { COMPANY_REPOSITORY } from './repositories/company.repository';
import { CompanyService } from './services/company/company.service';
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
      companySoonRoute(
        'ventas',
        'Ventas',
        'Resumen consolidado de ventas de todas tus tiendas.',
        'fa-solid fa-cart-shopping',
      ),
      companySoonRoute(
        'clientes',
        'Clientes',
        'La cartera de clientes de tu empresa.',
        'fa-solid fa-user-group',
      ),
      {
        path: 'productos',
        loadComponent: () => import('./pages/company-catalog/company-catalog.component'),
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
      companySoonRoute(
        'tiendas',
        'Tiendas',
        'Crea y administra las tiendas de la empresa.',
        'fa-solid fa-store',
      ),
      companySoonRoute(
        'vendedores',
        'Vendedores',
        'Invita y administra vendedores por tienda.',
        'fa-solid fa-user-tie',
      ),
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
