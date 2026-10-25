import { ApiConfiguration, DEFAULT_API_CONFIG } from '../app/core/config/api.config';

export const environment = {
  production: true,
  frontendUrl: 'https://kb-coleccion-internacional-ni.web.app',
  // Proxy server-side del gateway (ADR-29): añade el Basic del gate de staging
  // sin exponerlo en el bundle. Ver docs/api-proxy.md.
  apiUrl: 'https://api.kbcoleccion.com/api-proxy/api/v1',
  // Endpoint público del backend de IA `ai_scraper_executor`. Backend independiente:
  // basta con fijar aquí su URL y habilitar el CORS en el backend
  // (`CORS_ORIGINS=<origen del frontend>`). Sustituir por la URL real de producción.
  aiScraperUrl: '',
  apiConfig: {
    ...DEFAULT_API_CONFIG,
    dataSource: 'api',
  } as ApiConfiguration,
};
