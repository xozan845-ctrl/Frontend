import { computed, Injectable, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import type { AppVersionInfo } from './app-version.types';

const VERSION_URL = 'version.json';
const MAX_CHANGES = 6;

const initialInfo = (): AppVersionInfo => ({
  version: environment.appVersion,
  changes: [],
  totalChanges: 0,
});

/**
 * Versión desplegada y novedades. Se leen de `version.json` (generado desde
 * `package.json` + commits de Git en build/start) para no editar el aviso a mano.
 */
@Injectable({ providedIn: 'root' })
export class AppVersionService {
  readonly info = signal<AppVersionInfo>(initialInfo());
  readonly version = computed(() => this.info().version);
  readonly changes = computed(() => this.info().changes);
  readonly totalChanges = computed(() => this.info().totalChanges);

  private loaded = false;

  constructor() {
    void this.load();
  }

  /** Fuerza una lectura sin caché cuando el service worker anuncia versión nueva. */
  async load(force = false): Promise<AppVersionInfo> {
    if (this.loaded && !force) return this.info();

    try {
      const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('version.json no disponible');
      const data = (await response.json()) as Partial<AppVersionInfo>;
      const changes = Array.isArray(data.changes)
        ? data.changes
            .filter((change): change is string => typeof change === 'string')
            .slice(0, MAX_CHANGES)
        : [];

      this.info.set({
        version:
          typeof data.version === 'string' && data.version ? data.version : environment.appVersion,
        changes,
        totalChanges: typeof data.totalChanges === 'number' ? data.totalChanges : changes.length,
      });
    } catch {
      // Sin red o sin version.json: se conserva la versión compilada.
      this.info.set({ ...this.info(), changes: [], totalChanges: 0 });
    }

    this.loaded = true;
    return this.info();
  }
}
