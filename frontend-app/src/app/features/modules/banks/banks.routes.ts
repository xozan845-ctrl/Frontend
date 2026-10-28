import { Routes } from '@angular/router';
import { BanksStore } from '../../domains/banks/public-api';

/** Ruta lazy del módulo; el workspace padre provee `BANKS_SCOPE_CONFIG`. */
export const BANKS_ROUTES: Routes = [
  {
    path: '',
    providers: [BanksStore],
    loadComponent: () => import('./pages/banks/banks.component'),
  },
];
