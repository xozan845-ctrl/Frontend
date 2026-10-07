import { Component, OnDestroy, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-pwa-install-banner',
  standalone: true,
  templateUrl: './pwa-install-banner.component.html',
  styleUrl: './pwa-install-banner.component.css',
})
export class PwaInstallBannerComponent implements OnInit, OnDestroy {
  showBanner = signal(false);
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  // Handlers con referencia estable para poder retirarlos (R-AR-10).
  private readonly onBeforeInstallPrompt = (event: Event): void => {
    event.preventDefault();
    this.deferredPrompt = event as BeforeInstallPromptEvent;
    this.showBanner.set(true);
  };

  private readonly onAppInstalled = (): void => {
    this.showBanner.set(false);
    this.deferredPrompt = null;
  };

  ngOnInit(): void {
    // No mostrar si el usuario ya lo descartó.
    if (localStorage.getItem('ecom_pwa_dismissed') === 'true') return;

    window.addEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
    window.addEventListener('appinstalled', this.onAppInstalled);
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
    window.removeEventListener('appinstalled', this.onAppInstalled);
  }

  async install(): Promise<void> {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.showBanner.set(false);
    }
    this.deferredPrompt = null;
  }

  dismiss(): void {
    this.showBanner.set(false);
    localStorage.setItem('ecom_pwa_dismissed', 'true');
  }
}

// Extend Window event interface for TypeScript
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
