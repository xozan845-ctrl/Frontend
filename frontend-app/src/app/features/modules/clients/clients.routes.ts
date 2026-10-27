import { Routes } from '@angular/router';
import { CLIENTS_DATA_SOURCE } from '../../clients/public-api';
import { ClientsHttpDataSource } from '../../clients/public-api';
import { ClientsStore } from '../../clients/public-api';

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
