import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RuntimeConfig } from './runtime-config.model';

/** Ruta relativa al `base href`; el asset vive en `public/config.json`. */
const CONFIG_URL = 'config.json';

/** Tiempo máximo de espera: la app nunca debe colgarse por la config. */
const CONFIG_TIMEOUT_MS = 5000;

/**
 * Carga la configuración de despliegue (`config.json`) durante el arranque de
 * un build de producción y la aplica sobre `environment`, de modo que los
 * servicios (que leen `environment.apiUrl` al construirse) vean los valores
 * efectivos.
 *
 * Se registra con `provideAppInitializer` en `app.config.ts`: los servicios de
 * `features/` se crean después del arranque, por lo que ya leen la config
 * fusionada. Si el archivo no existe o falla, se mantiene el valor de
 * `src/environments/` sin ruido en consola (`R-E-9`).
 */
@Injectable({
  providedIn: 'root',
})
export class RuntimeConfigService {
  private readonly http = inject(HttpClient);

  /** Descarga `config.json` y fusiona sus valores no vacíos sobre `environment`. */
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
      this.http.get<RuntimeConfig>(CONFIG_URL).pipe(
        timeout(CONFIG_TIMEOUT_MS),
        catchError(() => of<RuntimeConfig>({})),
      ),
    );

    this.apply(config);
  }

  private apply(config: RuntimeConfig | null | undefined): void {
    if (!config) return;

    // E2E y desarrollo con `dataSource: 'mock'` no deben apuntar al backend
    // real por un `config.json` de despliegue (R-E-12).
    if (environment.apiConfig?.dataSource === 'mock') return;

    if (config.apiUrl) {
      environment.apiUrl = config.apiUrl;
    }

    if (config.aiScraperUrl) {
      environment.aiScraperUrl = config.aiScraperUrl;
    }
  }
}
