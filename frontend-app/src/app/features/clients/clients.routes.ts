import { Routes } from '@angular/router';
import { CLIENTS_DATA_SOURCE } from './repositories/clients-data-source.repository';
import { ClientsHttpDataSource } from './services/clients-data/clients-data.service';
import { ClientsStore } from './state/clients/clients.store';

/**
 * Rutas del módulo compartido de clientes. La fuente de datos y la
 * configuración visual las provee el workspace padre (empresa o vendedor).
 */
export const CLIENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/clients/clients.component'),
    providers: [ClientsStore, { provide: CLIENTS_DATA_SOURCE, useClass: ClientsHttpDataSource }],
  },
];
