import { Routes } from '@angular/router';
import { workspaceLandingGuard } from './guards/workspace-landing/workspace-landing.guard';

/**
 * Entrada canónica del backoffice: `/app` resuelve el contexto por rol y
 * `/app/<contexto>` monta el árbol del workspace correspondiente con el shell
 * compartido. Solo existen rutas canónicas `/app/...`; no se conservan rutas
 * antiguas.
 */
export const WORKSPACE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', canActivate: [workspaceLandingGuard], children: [] },
  {
    path: 'tienda',
    loadChildren: () => import('../vendor/vendor.routes').then((module) => module.VENDOR_ROUTES),
  },
  {
    path: 'admin',
    loadChildren: () => import('../admin/admin.routes').then((module) => module.ADMIN_ROUTES),
  },
  {
    path: 'logistica',
    loadChildren: () =>
      import('../logistica/logistica.routes').then((module) => module.LOGISTICA_ROUTES),
  },
  {
    path: '',
    loadChildren: () =>
      import('../empresas/empresas.routes').then((module) => [module.COMPANY_WORKSPACE_ROUTE]),
  },
];
