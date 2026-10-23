import { Route, Routes } from '@angular/router';
import { fieldGuard, logisticsGuard } from '../auth/public-api';
import { ENVIO_REPOSITORY } from './repositories/envio.repository';
import { INCIDENCIA_REPOSITORY } from './repositories/incidencia.repository';
import { PERSONAL_REPOSITORY } from './repositories/personal.repository';
import { RUTA_REPOSITORY } from './repositories/ruta.repository';
import { EnvioService } from './services/envio/envio.service';
import { IncidenciaService } from './services/incidencia/incidencia.service';
import { PersonalService } from './services/personal/personal.service';
import { RutaService } from './services/ruta/ruta.service';
import { EnviosStore } from './state/envios/envios.store';
import { IncidenciasStore } from './state/incidencias/incidencias.store';
import { LogisticaDashboardStore } from './state/logistica-dashboard/logistica-dashboard.store';
import { PersonalStore } from './state/personal/personal.store';
import { RutasStore } from './state/rutas/rutas.store';

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
      {
        path: 'envios',
        canActivate: [logisticsGuard],
        // El store y su puerto viven al alcance de la ruta y se liberan al salir.
        providers: [EnviosStore, { provide: ENVIO_REPOSITORY, useClass: EnvioService }],
        loadComponent: () => import('./pages/envios/envios.component'),
      },
      comingSoonRoute(
        'mapa-clientes',
        'Mapa de clientes',
        'La geolocalización de tus clientes y sus rutas asignadas.',
        'fa-solid fa-map',
      ),
      {
        path: 'rutas',
        canActivate: [fieldGuard],
        providers: [RutasStore, { provide: RUTA_REPOSITORY, useClass: RutaService }],
        loadComponent: () => import('./pages/rutas/rutas.component'),
      },
      comingSoonRoute(
        'pedidos',
        'Pedidos en ruta',
        'El detalle de cada pedido que va camino al cliente.',
        'fa-solid fa-box',
      ),
      {
        path: 'repartidores',
        canActivate: [fieldGuard],
        providers: [PersonalStore, { provide: PERSONAL_REPOSITORY, useClass: PersonalService }],
        loadComponent: () => import('./pages/personal/personal.component'),
      },
      comingSoonRoute(
        'zonas',
        'Zonas',
        'La cobertura de entrega y sus límites.',
        'fa-solid fa-location-dot',
      ),
      {
        path: 'incidencias',
        canActivate: [fieldGuard],
        providers: [
          IncidenciasStore,
          { provide: INCIDENCIA_REPOSITORY, useClass: IncidenciaService },
        ],
        loadComponent: () => import('./pages/incidencias/incidencias.component'),
      },
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
