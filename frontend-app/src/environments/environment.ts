import { ApiConfiguration, DEFAULT_API_CONFIG } from '../app/core/config/api.config';

export const environment = {
  production: false,
  // Backend local (gateway de Core Engine) para desarrollo.
  apiUrl: 'http://localhost:8080',
  apiConfig: {
    ...DEFAULT_API_CONFIG,
    dataSource: 'api',
  } as ApiConfiguration,
};
