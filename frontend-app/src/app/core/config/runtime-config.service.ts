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
 * Carga la configuración de despliegue (`config.json`) durante el arranque y
 * la aplica sobre `environment`, de modo que los servicios (que leen
 * `environment.apiUrl` al construirse) vean los valores efectivos.
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

    if (config.apiUrl) {
      environment.apiUrl = config.apiUrl;
    }

    if (config.aiScraperUrl) {
      environment.aiScraperUrl = config.aiScraperUrl;
    }
  }
}
