import { ApiConfiguration, DEFAULT_API_CONFIG } from '../app/core/config/api.config';

// Entorno para pruebas E2E: usa los mocks del frontend (R-E-12, hermetismo).
// El backend de IA se intercepta en Playwright (`page.route('**/ai-api/**')`),
// por eso la URL es relativa y no depende de ningún servidor real.
export const environment = {
  production: false,
  apiUrl: '',
  aiScraperUrl: '/ai-api',
  apiConfig: {
    ...DEFAULT_API_CONFIG,
    dataSource: 'mock',
  } as ApiConfiguration,
};
