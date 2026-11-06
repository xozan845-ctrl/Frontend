import { Injectable, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';

const VERSION_URL = 'version.json';

/**
 * Versión desplegada de la app. Se lee de `version.json` (generado desde
 * `package.json` en build/start) para no recompilar el bundle al mostrarla.
 */
@Injectable({ providedIn: 'root' })
export class AppVersionService {
  readonly version = signal(environment.appVersion);
  private loaded = false;

  constructor() {
    void this.load();
  }

  /** Fuerza una lectura sin caché cuando el service worker anuncia versión nueva. */
  async load(force = false): Promise<string> {
    if (this.loaded && !force) return this.version();

    try {
      const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('version.json no disponible');
      const data = (await response.json()) as { version?: string };
      if (data.version) this.version.set(data.version);
    } catch {
      // Sin red o sin version.json: se conserva la versión compilada.
    }

    this.loaded = true;
    return this.version();
  }
}
