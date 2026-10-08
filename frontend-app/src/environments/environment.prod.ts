import { ApiConfiguration, DEFAULT_API_CONFIG } from '../app/core/config/api.config';

export const environment = {
  production: true,
  // Gateway del backend (Core Engine) en producción. Ver docs/dockploy-setup.md §4.
  apiUrl: 'https://api.kbcoleccion.com/api/v1',
  apiConfig: {
    ...DEFAULT_API_CONFIG,
    dataSource: 'api',
    // Tienda publicada en Core Engine que consume el storefront.
    // En producción se resuelve en runtime vía `/config.json` (STORE_ID del
    // contenedor); vacío aquí es el fallback si no se inyecta config.
    storeId: '',
  } as ApiConfiguration,
};
