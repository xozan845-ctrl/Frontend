import { ApiConfiguration, DEFAULT_API_CONFIG } from '../app/shared/constants/api.config';

export const environment = {
  production: true,
  // Ver docs/dockploy-setup.md §4: definir aquí la URL del gateway del backend
  // (Core Engine) antes de desplegar. Con '' la app avisa de que no está configurada.
  apiUrl: '',
  apiConfig: {
    ...DEFAULT_API_CONFIG,
    dataSource: 'api',
  } as ApiConfiguration,
};
