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
import type { CompanyInfo } from '../models/company.model';

export interface RuntimeConfig {
  /** URL base del API (gateway de Core Engine). */
  apiUrl?: string;
  /** URL base del backend de IA `ai_scraper_executor` (ADR-18). */
  aiScraperUrl?: string;
  /** Identidad y contenido público por defecto del operador (F30). */
  storefront?: Partial<CompanyInfo>;
  /** Configuración pública por tienda; la clave es el `storeId` de la URL (F30). */
  storefronts?: Record<string, Partial<CompanyInfo>>;
}
