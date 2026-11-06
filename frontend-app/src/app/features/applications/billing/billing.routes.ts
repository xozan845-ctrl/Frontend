import { Routes } from '@angular/router';

/**
 * Páginas de facturación (ADR-23). Se montan dentro del workspace de tienda
 * (`/app/tienda/facturacion`); el shell y el guard de tienda los aporta el
 * workspace padre. No tienen shell propio para evitar un sidebar anidado.
 */
export const BILLING_PAGE_ROUTES: Routes = [
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
];
