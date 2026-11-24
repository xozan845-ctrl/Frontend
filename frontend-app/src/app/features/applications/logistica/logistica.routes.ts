import { Route, Routes } from '@angular/router';
import { logisticsGuard } from './guards/logistics/logistics.guard';
import { LOGISTICS_COMPANY_REPOSITORY } from './repositories/logistics-company.repository';
import { LogisticsCompanyService } from './services/logistics-company/logistics-company.service';
import { fieldGuard, moduleGuard } from '../auth/public-api';
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
import { LogisticsCompanyStore } from './state/logistics-company/logistics-company.store';
import { PersonalStore } from './state/personal/personal.store';
import { RutasStore } from './state/rutas/rutas.store';

/** Secciones del módulo sin fase: página real "En construcción" (`R-UX-1`, `R-UX-6`). */
const comingSoonRoute = (
  path: string,
  moduleId: string,
  title: string,
  description: string,
  icon: string,
): Route => ({
  path,
  canActivate: [moduleGuard(moduleId)],
  loadComponent: () => import('../../../shared/ui/coming-soon/coming-soon.component'),
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
    canActivate: [logisticsGuard],
    data: { workspace: 'logistics' },
    loadComponent: () => import('./pages/logistica-shell/logistica-shell.component'),
    // El store vive al alcance del módulo y se libera al salir (`R-AR-5`, ADR-21).
    providers: [LogisticaDashboardStore],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'crear',
        canActivate: [logisticsGuard],
        providers: [
          LogisticsCompanyStore,
          { provide: LOGISTICS_COMPANY_REPOSITORY, useClass: LogisticsCompanyService },
        ],
        loadComponent: () =>
          import('./pages/logistics-company-onboarding/logistics-company-onboarding.component'),
      },
      {
        path: 'dashboard',
        canActivate: [moduleGuard('logistics.dashboard')],
        loadComponent: () => import('./pages/dashboard/dashboard.component'),
      },
      {
        path: 'envios',
        canActivate: [moduleGuard('logistics.shipments'), logisticsGuard],
        // El store y su puerto viven al alcance de la ruta y se liberan al salir.
        providers: [EnviosStore, { provide: ENVIO_REPOSITORY, useClass: EnvioService }],
        loadComponent: () => import('./pages/envios/envios.component'),
      },
      comingSoonRoute(
        'mapa-clientes',
        'logistics.map',
        'Mapa de clientes',
        'La geolocalización de tus clientes y sus rutas asignadas.',
        'fa-solid fa-map',
      ),
      {
        path: 'rutas',
        canActivate: [moduleGuard('logistics.routes'), fieldGuard],
        providers: [RutasStore, { provide: RUTA_REPOSITORY, useClass: RutaService }],
        loadComponent: () => import('./pages/rutas/rutas.component'),
      },
      comingSoonRoute(
        'pedidos',
        'logistics.orders',
        'Pedidos en ruta',
        'El detalle de cada pedido que va camino al cliente.',
        'fa-solid fa-box',
      ),
      {
        path: 'repartidores',
        canActivate: [moduleGuard('logistics.couriers'), fieldGuard],
        providers: [PersonalStore, { provide: PERSONAL_REPOSITORY, useClass: PersonalService }],
        loadComponent: () => import('./pages/personal/personal.component'),
      },
      comingSoonRoute(
        'zonas',
        'logistics.zones',
        'Zonas',
        'La cobertura de entrega y sus límites.',
        'fa-solid fa-location-dot',
      ),
      {
        path: 'incidencias',
        canActivate: [moduleGuard('logistics.incidents'), fieldGuard],
        providers: [
          IncidenciasStore,
          { provide: INCIDENCIA_REPOSITORY, useClass: IncidenciaService },
        ],
        loadComponent: () => import('./pages/incidencias/incidencias.component'),
      },
      comingSoonRoute(
        'reportes',
        'logistics.reports',
        'Reportes',
        'Las métricas de entregas, tiempos y cumplimiento.',
        'fa-solid fa-chart-column',
      ),
      comingSoonRoute(
        'configuracion',
        'logistics.settings',
        'Configuración',
        'Los ajustes del módulo de logística.',
        'fa-solid fa-gear',
      ),
    ],
  },
];
