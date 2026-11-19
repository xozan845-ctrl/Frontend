import { inject, Injectable } from '@angular/core';
import { HttpBackend, HttpRequest, HttpResponse } from '@angular/common/http';
import { catchError, defaultIfEmpty, filter, firstValueFrom, map, of, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RuntimeConfig } from './runtime-config.model';

/** Ruta relativa al `base href`; el asset vive en `public/config.json`. */
const CONFIG_URL = 'config.json';

/** Tiempo máximo de espera: la app nunca debe colgarse por la config. */
const CONFIG_TIMEOUT_MS = 5000;

/**
 * Carga la configuración de despliegue (`config.json`) durante el arranque de
 * un build de producción y la aplica sobre `environment`, de modo que los
 * servicios que se crean después del arranque vean los valores efectivos.
 *
 * Se registra con `provideAppInitializer` en `app.config.ts`. La descarga usa
 * `HttpBackend` para **no** ejecutar los interceptores: si usara `HttpClient`,
 * `authInterceptor` inyectaría `AuthStore` y construiría `AuthService` antes
 * de aplicar el override (F10). La configuración es pública y no depende de la
 * sesión (`R-AR-13`).
 *
 * En producción, una configuración ausente, incompleta o inválida deja
 * `environment.apiUrl` vacía: los servicios fallan con su error explícito de
 * `apiUrl no configurado` en lugar de usar en silencio el host compilado
 * (`R-AR-11`, `R-SE-8`).
 */
@Injectable({
  providedIn: 'root',
})
export class RuntimeConfigService {
  private readonly backend = inject(HttpBackend);

  /** Descarga `config.json` y aplica sus valores validados sobre `environment`. */
  async load(): Promise<void> {
    // Solo los builds de despliegue aplican config.json. En `ng serve` manda
    // `environment.ts` (API local): el config.json versionado apunta al API
    // público y su CORS no incluye localhost (ADR-13).
    if (!environment.production) return;

    // E2E/mock: la suite es hermética y usa `environment` + fixtures de
    // Playwright. El config.json de despliegue apuntaría al API real y rompería
    // el aislamiento (R-E-12).
    if (environment.apiConfig.dataSource === 'mock') return;

    const config = await firstValueFrom(
      this.backend.handle(new HttpRequest<RuntimeConfig>('GET', CONFIG_URL)).pipe(
        filter((event): event is HttpResponse<RuntimeConfig> => event instanceof HttpResponse),
        map((response) => response.body),
        timeout(CONFIG_TIMEOUT_MS),
        catchError(() => of<RuntimeConfig | null>(null)),
        defaultIfEmpty(null),
      ),
    );

    this.apply(config);
  }

  private apply(config: RuntimeConfig | null | undefined): void {
    // E2E y desarrollo con `dataSource: 'mock'` no deben apuntar al backend
    // real por un `config.json` de despliegue (R-E-12).
    if (environment.apiConfig?.dataSource === 'mock') return;

    const apiUrl = normalizeUrl(config?.apiUrl);
    if (!apiUrl) {
      environment.apiUrl = '';
      return;
    }

    environment.apiUrl = apiUrl;

    const aiScraperUrl = normalizeUrl(config?.aiScraperUrl);
    if (aiScraperUrl) {
      environment.aiScraperUrl = aiScraperUrl;
    }
  }
}

/** Acepta URL absoluta http(s) o relativa al origen, y descarta el resto. */
function normalizeUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  if (!url) return null;
  // Ruta relativa al origen; `//host` sería una URL de otro origen.
  if (url.startsWith('/') && !url.startsWith('//')) return url;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}
