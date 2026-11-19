/**
 * Configuración de despliegue leída en tiempo de ejecución (`/config.json`).
 *
 * Permite ajustar valores por entorno (URL del API, tienda publicada) sin
 * recompilar el bundle: el contenedor escribe `config.json` desde variables de
 * entorno al arrancar (ver `Dockerfile` y `docs/dockploy-setup.md` §4).
 *
 * En producción `apiUrl` es obligatoria: si falta o es inválida, la app deja
 * `environment.apiUrl` vacía para fallar explícitamente en lugar de usar el
 * host compilado (`R-AR-11`). `aiScraperUrl` sigue siendo opcional.
 */
export interface RuntimeConfig {
  /** URL base del API (gateway de Core Engine). */
  apiUrl?: string;
  /** URL base del backend de IA `ai_scraper_executor` (ADR-18). */
  aiScraperUrl?: string;
}
