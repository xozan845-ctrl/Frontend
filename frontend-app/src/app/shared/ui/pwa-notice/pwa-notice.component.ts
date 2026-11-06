import { Component, DestroyRef, inject, signal } from '@angular/core';
import { AppUpdateService } from '../../../core/services/app-update/app-update.service';
import { AppVersionService } from '../../../core/services/app-version/app-version.service';
import type { BeforeInstallPromptEvent } from './pwa-notice.types';

const DISMISSED_VERSION_KEY = 'ecom_pwa_dismissed_version';

/**
 * Aviso flotante reutilizable para PWA:
 * - instalación: aparece cuando el navegador ofrece `beforeinstallprompt`;
 * - actualización: aparece cuando `SwUpdate` detecta una versión nueva.
 */
@Component({
  selector: 'app-pwa-notice',
  standalone: true,
  templateUrl: './pwa-notice.component.html',
  styleUrl: './pwa-notice.component.css',
})
export class PwaNoticeComponent {
  private readonly appUpdate = inject(AppUpdateService);
  private readonly appVersion = inject(AppVersionService);

  readonly update = this.appUpdate.update;
  readonly version = this.appVersion.version;
  showBanner = signal(false);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  private readonly onBeforeInstallPrompt = (event: Event): void => {
    event.preventDefault();
    this.deferredPrompt = event as BeforeInstallPromptEvent;
    if (this.canShowInstall()) this.showBanner.set(true);
  };

  private readonly onInstallAvailable = (): void => {
    const prompt = window.__pwaInstallPrompt;
    if (prompt) this.onBeforeInstallPrompt(prompt);
  };

  private readonly onAppInstalled = (): void => {
    this.showBanner.set(false);
    this.deferredPrompt = null;
    window.__pwaInstallPrompt = null;
    try {
      localStorage.removeItem(DISMISSED_VERSION_KEY);
    } catch {
      // Almacenamiento no disponible.
    }
  };

  private readonly cleanup = inject(DestroyRef).onDestroy(() => {
    window.removeEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
    window.removeEventListener('appinstalled', this.onAppInstalled);
    window.removeEventListener('pwa-install-available', this.onInstallAvailable);
    window.removeEventListener('pwa-installed', this.onAppInstalled);
  });

  private readonly registered = this.registerListeners();

  private registerListeners(): void {
    window.addEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
    window.addEventListener('appinstalled', this.onAppInstalled);
    window.addEventListener('pwa-install-available', this.onInstallAvailable);
    window.addEventListener('pwa-installed', this.onAppInstalled);

    // Si el script de captura ya guardó el prompt, se consume al arrancar.
    if (window.__pwaInstallPrompt) this.onBeforeInstallPrompt(window.__pwaInstallPrompt);
  }

  async install(): Promise<void> {
    const prompt = window.__pwaInstallPrompt ?? this.deferredPrompt;
    if (!prompt) return;

    prompt.prompt();
    await prompt.userChoice;

    // El evento solo se puede consumir una vez; se oculta para no dejar un
    // botón que ya no puede abrir el prompt nativo.
    this.showBanner.set(false);
    this.deferredPrompt = null;
    window.__pwaInstallPrompt = null;
  }

  dismiss(): void {
    this.showBanner.set(false);
    try {
      localStorage.setItem(DISMISSED_VERSION_KEY, this.version());
      // Limpia la clave antigua que ocultaba el banner para siempre.
      localStorage.removeItem('ecom_pwa_dismissed');
    } catch {
      // Almacenamiento no disponible.
    }
  }

  refreshUpdate(): void {
    void this.appUpdate.refresh();
  }

  dismissUpdate(): void {
    this.appUpdate.dismiss();
  }

  private canShowInstall(): boolean {
    if (this.isStandalone()) return false;
    try {
      return localStorage.getItem(DISMISSED_VERSION_KEY) !== this.version();
    } catch {
      return true;
    }
  }

  private isStandalone(): boolean {
    const standaloneMedia = window.matchMedia?.('(display-mode: standalone)')?.matches ?? false;
    const navigatorFlag = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    return standaloneMedia || navigatorFlag;
  }
}
