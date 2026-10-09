import { ApiConfiguration, DEFAULT_API_CONFIG } from '../app/core/config/api.config';

export const environment = {
  production: false,
  // Backend local (gateway de Core Engine) para desarrollo.
  apiUrl: 'http://localhost:8080/api/v1',
  // Endpoint del backend de IA `ai_scraper_executor` (independiente). El frontend
  // solo se comunica con él por HTTP; el CORS lo habilita el backend
  // (`CORS_ORIGINS=http://localhost:4200`).
  aiScraperUrl: 'http://localhost:3000/api/v1',
  apiConfig: {
    ...DEFAULT_API_CONFIG,
    dataSource: 'api',
  } as ApiConfiguration,
};
