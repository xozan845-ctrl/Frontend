import { ApiConfiguration, DEFAULT_API_CONFIG } from '../app/core/config/api.config';

// Entorno para pruebas E2E (R-E-12, hermetismo): el API Core Engine se responde
// con los fixtures de Playwright (`e2e/api-mock.ts`) sobre `apiUrl: '/api/v1'`
// (mismo origen) y el backend de IA se intercepta en `page.route('**/ai-api/**')`.
// No hay backend real: los flujos que aún simulan sesión local (auth, carrito,
// pedidos) siguen en modo `mock`.
export const environment = {
  production: false,
  apiUrl: '/api/v1',
  aiScraperUrl: '/ai-api',
  apiConfig: {
    ...DEFAULT_API_CONFIG,
    dataSource: 'mock',
  } as ApiConfiguration,
};
