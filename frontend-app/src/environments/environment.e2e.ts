import { ApiConfiguration, DEFAULT_API_CONFIG } from '../app/shared/constants/api.config';

// Entorno para pruebas E2E: usa los mocks del frontend (R-E-12, hermetismo).
export const environment = {
  production: false,
  apiUrl: '',
  apiConfig: {
    ...DEFAULT_API_CONFIG,
    dataSource: 'mock',
  } as ApiConfiguration,
};
