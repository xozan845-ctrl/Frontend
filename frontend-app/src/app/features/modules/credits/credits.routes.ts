import { Routes } from '@angular/router';
import { CreditsStore } from '../../credits/public-api';

/** Ruta lazy del módulo; el workspace padre provee `CREDITS_SCOPE_CONFIG`. */
export const CREDITS_ROUTES: Routes = [
  {
    path: '',
    providers: [CreditsStore],
    loadComponent: () => import('./pages/credits/credits.component'),
  },
];
