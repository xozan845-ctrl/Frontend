import { Routes } from '@angular/router';
import { BarcodesStore } from '../../barcodes/public-api';

/** Ruta lazy del módulo; el workspace padre provee `BARCODES_SCOPE_CONFIG`. */
export const BARCODES_ROUTES: Routes = [
  {
    path: '',
    providers: [BarcodesStore],
    loadComponent: () => import('./pages/barcodes/barcodes.component'),
  },
];
