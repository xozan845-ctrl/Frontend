import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Header } from './layout/header/header.component';
import { Footer } from './layout/footer/footer.component';
import { CartDrawerComponent } from './features/applications/cart/pages/cart-drawer/cart-drawer.component';
import { ToastComponent } from './shared/ui/notification/toast.component';
import { PwaNoticeComponent } from './shared/ui/pwa-notice/pwa-notice.component';
import { FloatingSupportComponent } from './shared/ui/floating-support/floating-support.component';
import { RuntimeConfigService } from './core/config/runtime-config.service';
import { StoreConfigService } from './core/services/store-config/store-config.service';
import { ProductStore } from './features/domains/storefront/public-api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Header,
    Footer,
    CartDrawerComponent,
    ToastComponent,
    PwaNoticeComponent,
    FloatingSupportComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly storeConfig = inject(StoreConfigService);
  private readonly productStore = inject(ProductStore);

  /** El chrome público no debe envolver los workspaces autenticados. */
  readonly isBackoffice = signal(this.isBackofficeUrl(this.router.url));

  /** Configuración efectiva del contexto; el chrome solo la recibe por input. */
  readonly storefrontConfig = this.storeConfig.companyInfo;
  readonly storeId = computed(() => this.productStore.storeId() ?? '');

  private readonly routerEvents = this.router.events
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isBackoffice.set(this.isBackofficeUrl(event.urlAfterRedirects));
      }
    });

  /**
   * F30: cada cambio de `storeId` reconstruye el contexto desde cero. La ficha
   * cargada se usa solo cuando pertenece al id activo, para no filtrar la tienda
   * anterior mientras el resolver trae la nueva.
   */
  private readonly syncStorefrontContext = effect(() => {
    const storeId = this.productStore.storeId();
    if (!storeId) {
      this.storeConfig.clear();
      return;
    }

    const operator = this.runtimeConfig.storefrontFor(storeId);
    const loadedStore = this.productStore.store();
    const activeStore = loadedStore?.id === storeId ? loadedStore : undefined;

    this.storeConfig.setContext(storeId, {
      ...operator,
      name: operator?.name ?? activeStore?.name,
      description: operator?.description ?? activeStore?.description,
    });
  });

  private isBackofficeUrl(url: string): boolean {
    // Los workspaces autenticados y las invitaciones públicas no llevan el
    // chrome del storefront (header, footer, carrito y soporte flotante).
    return /^\/(app|ia|i|registro\/vendedor)(\/|$|\?)/.test(url);
  }
}
