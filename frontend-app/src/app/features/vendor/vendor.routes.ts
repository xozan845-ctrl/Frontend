import { Route, Routes } from '@angular/router';
import { vendorGuard } from './guards/vendor.guard';

/** Sección aún sin fase: página "En construcción" real (`R-UX-1`) con SEO (`R-UX-6`). */
const comingSoonRoute = (title: string, description: string, icon: string): Route => ({
  loadComponent: () => import('./pages/coming-soon/coming-soon.component'),
  data: { title, description, icon },
});

/**
 * Rutas del panel del vendedor (ADR-20, `R-AR-12`, `R-LZ-1`): se cargan con
 * `loadChildren` desde `app.routes.ts` para que ni el POS ni sus stores formen
 * parte del bundle inicial. El guard exige rol `vendedor` (`R-SE-6`) y las
 * secciones sin fase responden con una página "En construcción" (`R-UX-1`) en
 * lugar de enlaces muertos. Los datos de cada sección llegan por `data` con
 * `withComponentInputBinding`.
 */
export const VENDOR_ROUTES: Routes = [
  {
    path: '',
    canActivate: [vendorGuard],
    loadComponent: () => import('./pages/vendor-shell/vendor-shell.component'),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        ...comingSoonRoute(
          'Inicio',
          'El resumen de tu tienda: ventas del día y pedidos recientes.',
          'fa-solid fa-house',
        ),
      },
      {
        path: 'ventas/nuevo',
        ...comingSoonRoute(
          'Nuevo pedido',
          'El punto de venta para registrar los pedidos de tus clientes.',
          'fa-solid fa-cart-shopping',
        ),
      },
      {
        path: 'pedidos',
        ...comingSoonRoute(
          'Pedidos',
          'La lista completa de pedidos con su estado y detalle.',
          'fa-solid fa-receipt',
        ),
      },
      {
        path: 'pedidos/:id',
        ...comingSoonRoute(
          'Detalle del pedido',
          'Las líneas, totales y estado de cada pedido.',
          'fa-solid fa-file-invoice',
        ),
      },
      {
        path: 'clientes',
        ...comingSoonRoute(
          'Clientes',
          'Tu cartera de clientes con búsqueda y alta.',
          'fa-solid fa-user-group',
        ),
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
