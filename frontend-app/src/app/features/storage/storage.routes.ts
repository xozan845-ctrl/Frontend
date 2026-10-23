import { Routes } from '@angular/router';
import { STORAGE_REPOSITORY } from './repositories/storage.repository';
import { StorageService } from './services/storage/storage.service';
import { StorageStore } from './state/storage/storage.store';

/**
 * Almacenamiento del tenant (ADR-42). Se monta dentro del shell del vendedor,
 * que ya exige sesión y rol; el store y el puerto viven al alcance de la ruta.
 */
export const STORAGE_ROUTES: Routes = [
  {
    path: 'almacenamiento',
    providers: [StorageStore, { provide: STORAGE_REPOSITORY, useClass: StorageService }],
    loadComponent: () => import('./pages/storage/storage.component'),
  },
];
