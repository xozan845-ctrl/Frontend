import { Routes } from '@angular/router';

/**
 * Punto de composición de las rutas compartidas company/store. La fábrica vive
 * en `constants/commercial.routes.ts` y se montará en las rutas canónicas del
 * workspace en la siguiente fase.
 */
export const WORKSPACE_ROUTES: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./constants/commercial.routes').then((module) =>
        module.commercialScopeRoutes('company'),
      ),
  },
];
