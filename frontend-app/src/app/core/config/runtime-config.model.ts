/**
 * Configuración de despliegue leída en tiempo de ejecución (`/config.json`).
 *
 * Permite ajustar valores por entorno (URL del API, tienda publicada) sin
 * recompilar el bundle: el contenedor escribe `config.json` desde variables de
 * entorno al arrancar (ver `Dockerfile` y `docs/dockploy-setup.md` §4).
 *
 * Todos los campos son opcionales: los vacíos conservan el valor de
 * `src/environments/` (`R-AR-11`).
 */

/**
 * Paquete contratado y capacidades habilitadas para esta instalación.
 * `capabilities` decide qué módulos del registro pueden activarse; no concede
 * permisos de negocio ni sustituye la autorización del backend (`R-SE-1`).
 */
export interface RuntimePackageConfig {
  /** Identificador del paquete, solo trazabilidad/configuración. */
  id?: string;
  /** Capacidades activas. Comodín `*` para el entorno local/demo. */
  capabilities?: readonly string[];
}

export interface RuntimeConfig {
  /** URL base del API (gateway de Core Engine). */
  apiUrl?: string;
  /** URL base del backend de IA `ai_scraper_executor` (ADR-18). */
  aiScraperUrl?: string;
  /** Paquete y capacidades que resuelven la disponibilidad de módulos (ADR-85). */
  package?: RuntimePackageConfig;
}
