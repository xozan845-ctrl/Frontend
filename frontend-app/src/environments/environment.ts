import { ApiConfiguration, DEFAULT_API_CONFIG } from '../app/core/config/api.config';

export const environment = {
  production: false,
  // Backend local (gateway de Core Engine) para desarrollo.
  apiUrl: 'http://localhost:8080/api/v1',
  apiConfig: {
    ...DEFAULT_API_CONFIG,
    dataSource: 'api',
    storeId: 'f7603931-b32d-4251-962a-a9c9e290d1c5',
  } as ApiConfiguration,
};
