import { Route, Routes } from '@angular/router';
import { LogisticaDashboardStore } from './state/logistica-dashboard/logistica-dashboard.store';

/** Secciones del módulo sin fase: página real "En construcción" (`R-UX-1`, `R-UX-6`). */
const comingSoonRoute = (
  path: string,
  title: string,
  description: string,
  icon: string,
): Route => ({
  path,
  loadComponent: () => import('../../shared/ui/coming-soon/coming-soon.component'),
  data: { title, description, icon, context: 'Logística' },
});

/**
 * Rutas del módulo de logística (ADR-25, `R-AR-12`, `R-LZ-1`): se cargan con
 * `loadChildren` desde `app.routes.ts` para que el mapa, los componentes y el
 * store no formen parte del bundle inicial. El shell aporta el sidebar del
 * boceto y las secciones sin fase responden con una página "En construcción"
 * en lugar de enlaces muertos (`R-UX-1`).
 */
export const LOGISTICA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/logistica-shell/logistica-shell.component'),
    // El store vive al alcance del módulo y se libera al salir (`R-AR-5`, ADR-21).
    providers: [LogisticaDashboardStore],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component'),
      },
      comingSoonRoute(
        'mapa-clientes',
        'Mapa de clientes',
        'La geolocalización de tus clientes y sus rutas asignadas.',
        'fa-solid fa-map',
      ),
      comingSoonRoute(
        'rutas',
        'Rutas',
        'La planificación y el seguimiento de las rutas de reparto.',
        'fa-solid fa-route',
      ),
      comingSoonRoute(
        'pedidos',
        'Pedidos en ruta',
        'El detalle de cada pedido que va camino al cliente.',
        'fa-solid fa-box',
      ),
      comingSoonRoute(
        'repartidores',
        'Repartidores',
        'El equipo de reparto, sus turnos y su desempeño.',
        'fa-solid fa-user',
      ),
      comingSoonRoute(
        'zonas',
        'Zonas',
        'La cobertura de entrega y sus límites.',
        'fa-solid fa-location-dot',
      ),
      comingSoonRoute(
        'incidencias',
        'Incidencias',
        'Los problemas de entrega y su seguimiento.',
        'fa-solid fa-triangle-exclamation',
      ),
      comingSoonRoute(
        'reportes',
        'Reportes',
        'Las métricas de entregas, tiempos y cumplimiento.',
        'fa-solid fa-chart-column',
      ),
      comingSoonRoute(
        'configuracion',
        'Configuración',
        'Los ajustes del módulo de logística.',
        'fa-solid fa-gear',
      ),
    ],
  },
];
