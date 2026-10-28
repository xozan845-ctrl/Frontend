import { Routes } from '@angular/router';
import { PayablesStore } from '../../domains/payables/public-api';

/** Ruta lazy del módulo; el workspace padre provee `PAYABLES_SCOPE_CONFIG`. */
export const PAYABLES_ROUTES: Routes = [
  {
    path: '',
    providers: [PayablesStore],
    loadComponent: () => import('./pages/payables/payables.component'),
  },
];
