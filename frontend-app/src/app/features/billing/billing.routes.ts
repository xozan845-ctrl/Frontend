import { Routes } from '@angular/router';

/**
 * Rutas del módulo de facturación (ADR-23): extensión visual del panel del
 * vendedor, cargada con `loadChildren` desde `app.routes.ts` para no formar
 * parte del bundle inicial (`R-AR-12`, `R-LZ-1`). El shell aporta el sidebar
 * del diseño y las páginas se cargan con `loadComponent`.
 */
export const BILLING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/billing-shell/billing-shell.component'),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'nueva' },
      {
        path: 'nueva',
        loadComponent: () => import('./pages/new-invoice/new-invoice.component'),
      },
      {
        path: 'facturas',
        loadComponent: () => import('./pages/invoices/invoices.component'),
      },
      {
        path: 'facturas/:id',
        loadComponent: () => import('./pages/invoice-detail/invoice-detail.component'),
      },
    ],
  },
];
