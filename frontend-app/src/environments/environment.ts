import { ApiConfiguration, DEFAULT_API_CONFIG } from '../app/shared/constants/api.config';

export const environment = {
  production: false,
  apiUrl: '',
  apiConfig: {
    ...DEFAULT_API_CONFIG,
    dataSource: 'api',
  } as ApiConfiguration,
};
