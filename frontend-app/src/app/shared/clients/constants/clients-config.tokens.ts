import { InjectionToken } from '@angular/core';
import type { ClientsPageConfig, ClientsScopeConfig } from '../models/clients-config.model';

/** Configuración visual de la página de clientes del workspace activo. */
export const CLIENTS_PAGE_CONFIG = new InjectionToken<ClientsPageConfig>('ClientsPageConfig');

/** Ámbito de datos (empresa o vendedor) de la cartera de clientes. */
export const CLIENTS_SCOPE_CONFIG = new InjectionToken<ClientsScopeConfig>('ClientsScopeConfig');
