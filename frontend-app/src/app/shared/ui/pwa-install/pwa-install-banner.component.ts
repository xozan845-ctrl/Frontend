import { Component, signal, OnInit } from '@angular/core';

@Component({
  selector: 'app-pwa-install-banner',
  standalone: true,
  templateUrl: './pwa-install-banner.component.html',
  styleUrl: './pwa-install-banner.component.css',
})
export class PwaInstallBannerComponent implements OnInit {
  showBanner = signal(false);
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  ngOnInit(): void {
    // Don't show if already dismissed
    if (localStorage.getItem('ecom_pwa_dismissed') === 'true') return;

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.showBanner.set(true);
    });

    // Also handle if already installed
    window.addEventListener('appinstalled', () => {
      this.showBanner.set(false);
      this.deferredPrompt = null;
    });
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
