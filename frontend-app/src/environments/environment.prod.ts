import { ApiConfiguration, DEFAULT_API_CONFIG } from '../app/core/config/api.config';

export const environment = {
  production: true,
  // Gateway del backend (Core Engine) en producción. Ver docs/dockploy-setup.md §4.
  apiUrl: 'https://api.kbcoleccion.com/api/v1',
  // Endpoint público del backend de IA `ai_scraper_executor`. Backend independiente:
  // basta con fijar aquí su URL y habilitar el CORS en el backend
  // (`CORS_ORIGINS=<origen del frontend>`). Sustituir por la URL real de producción.
  aiScraperUrl: '',
  apiConfig: {
    ...DEFAULT_API_CONFIG,
    dataSource: 'api',
  } as ApiConfiguration,
};
