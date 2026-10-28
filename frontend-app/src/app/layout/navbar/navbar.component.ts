import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UpperCasePipe, CommonModule } from '@angular/common';
import { AuthStore, isCompanyOwnerRole } from '../../features/applications/auth/public-api';
import { CartStore, CartUiStore } from '../../features/applications/cart/public-api';
import { ProductStore } from '../../features/applications/products/public-api';
import { WishlistStore } from '../../features/applications/wishlist/public-api';
import { StoreConfigService } from '../../core/services/store-config/store-config.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, CommonModule, UpperCasePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class Navbar {
  readonly authStore = inject(AuthStore);
  readonly cartStore = inject(CartStore);
  readonly cartUiStore = inject(CartUiStore);
  readonly wishlistStore = inject(WishlistStore);
  readonly productStore = inject(ProductStore);
  private readonly storeConfig = inject(StoreConfigService);

  /** Tienda activa (de la URL); los enlaces del storefront la incluyen. */
  readonly storeId = computed(() => this.productStore.storeId() ?? '');
  readonly storeName = computed(() => this.productStore.store()?.name ?? '');
  readonly isCompanyOwner = computed(() => isCompanyOwnerRole(this.authStore.user()?.role));
  readonly homeLink = computed(() =>
    this.isCompanyOwner()
      ? ['/empresa/inicio']
      : this.storeId()
        ? ['/tienda', this.storeId()]
        : ['/'],
  );
  readonly companyWorkspaceLink = ['/empresa/inicio'];
  readonly shopLink = computed(() =>
    this.storeId() ? ['/tienda', this.storeId(), 'shop'] : ['/'],
  );
  readonly wishlistLink = computed(() =>
    this.storeId() ? ['/tienda', this.storeId(), 'wishlist'] : ['/'],
  );
  get companyInfo() {
    return this.storeConfig.companyInfo();
  }
  isMobileMenuOpen = signal(false);
  isDarkMode = signal(this.initialDarkMode());

  /** Tema inicial: preferencia guardada o del sistema, aplicada al `<html>`. */
  private initialDarkMode(): boolean {
    const savedTheme =
      typeof localStorage !== 'undefined' ? localStorage.getItem('ecom_theme') : null;
    const systemPrefersDark =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;
    const dark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);

    if (dark && typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
    }
    return dark;
  }

  toggleTheme() {
    this.isDarkMode.update((prev) => !prev);
    if (this.isDarkMode()) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ecom_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ecom_theme', 'light');
    }
  }
}
