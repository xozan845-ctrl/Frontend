import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Navbar } from './layout/navbar/navbar.component';
import { Footer } from './layout/footer/footer.component';
import { CartDrawerComponent } from './features/applications/cart/pages/cart-drawer/cart-drawer.component';
import { ToastComponent } from './shared/ui/notification/toast.component';
import { PwaInstallBannerComponent } from './shared/ui/pwa-install/pwa-install-banner.component';
import { FloatingSupportComponent } from './shared/ui/floating-support/floating-support.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Navbar,
    Footer,
    CartDrawerComponent,
    ToastComponent,
    PwaInstallBannerComponent,
    FloatingSupportComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** El chrome público no debe envolver los workspaces autenticados. */
  readonly isBackoffice = signal(this.isBackofficeUrl(this.router.url));

  private readonly routerEvents = this.router.events
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isBackoffice.set(this.isBackofficeUrl(event.urlAfterRedirects));
      }
    });

  private isBackofficeUrl(url: string): boolean {
    // Los workspaces autenticados y las invitaciones públicas no llevan el
    // chrome del storefront (navbar, footer, carrito y soporte flotante).
    return /^\/(empresa|vendedor|facturacion|logistica|admin|ia|i|registro\/vendedor)(\/|$|\?)/.test(
      url,
    );
  }
}
