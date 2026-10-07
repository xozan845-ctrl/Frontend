import { ApiConfiguration, DEFAULT_API_CONFIG } from '../app/core/config/api.config';

export const environment = {
  production: true,
  // Gateway del backend (Core Engine) en producción. Ver docs/dockploy-setup.md §4.
  apiUrl: 'https://api.kbcoleccion.com',
  apiConfig: {
    ...DEFAULT_API_CONFIG,
    dataSource: 'api',
  } as ApiConfiguration,
};
