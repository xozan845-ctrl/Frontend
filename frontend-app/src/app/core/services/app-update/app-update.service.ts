import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, type VersionReadyEvent } from '@angular/service-worker';
import { filter, fromEvent, interval, merge } from 'rxjs';
import { AppVersionService } from '../app-version/app-version.service';
import type { AppUpdateInfo } from './app-update.types';

const DISMISSED_KEY = 'ecom_update_dismissed_hash';
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Detecta versiones nuevas del service worker y expone un aviso reactivo.
 * No fuerza el refresh: el usuario decide cuándo aplicar los cambios.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly swUpdate = inject(SwUpdate, { optional: true });
  private readonly appVersion = inject(AppVersionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly update = signal<AppUpdateInfo | null>(null);
  readonly checking = signal(false);

  constructor() {
    const swUpdate = this.swUpdate;
    if (!swUpdate?.isEnabled) return;

    swUpdate.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => void this.showUpdate(event.latestVersion.hash));

    merge(
      fromEvent(document, 'visibilitychange').pipe(
        filter(() => document.visibilityState === 'visible'),
      ),
      interval(CHECK_INTERVAL_MS),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.checkForUpdate());

    void this.checkForUpdate();
  }

  private async showUpdate(hash: string): Promise<void> {
    if (this.readDismissed() === hash) return;

    const version = await this.appVersion.load(true);
    if (this.readDismissed() === hash) return;

    this.update.set({ ...version, hash });
  }

  /** Comprueba si hay una versión nueva; silencioso si no hay red. */
  async checkForUpdate(): Promise<void> {
    const swUpdate = this.swUpdate;
    if (!swUpdate?.isEnabled || this.checking()) return;

    this.checking.set(true);
    try {
      await swUpdate.checkForUpdate();
    } catch {
      // Sin conexión o SW no disponible: se reintenta en la próxima señal.
    } finally {
      this.checking.set(false);
    }
  }

  /** Activa la versión descargada y recarga para aplicar los cambios visuales. */
  async refresh(): Promise<void> {
    try {
      await this.swUpdate?.activateUpdate();
    } catch {
      // Si falla la activación, la recarga sigue siendo la salida segura.
    }
    this.reloadPage();
  }

  /** Punto único de recarga; aislado para pruebas sin navegación real. */
  protected reloadPage(): void {
    window.location.reload();
  }

  /** Silencia este hash concreto; la próxima versión volverá a avisar. */
  dismiss(): void {
    const current = this.update();
    if (current) {
      try {
        sessionStorage.setItem(DISMISSED_KEY, current.hash);
      } catch {
        // Almacenamiento no disponible.
      }
    }
    this.update.set(null);
  }

  private readDismissed(): string | null {
    try {
      return sessionStorage.getItem(DISMISSED_KEY);
    } catch {
      return null;
    }
  }
}
