import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UpperCasePipe, CommonModule } from '@angular/common';
import { AuthStore } from '../../features/auth/public-api';
import { CartStore } from '../../features/cart/public-api';
import { ProductStore } from '../../features/products/public-api';
import { WishlistStore } from '../../features/wishlist/public-api';
import { StoreConfigService } from '../../core/services/store-config.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, CommonModule, UpperCasePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class Navbar implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly cartStore = inject(CartStore);
  readonly wishlistStore = inject(WishlistStore);
  readonly productStore = inject(ProductStore);
  private readonly storeConfig = inject(StoreConfigService);

  /** Tienda activa (de la URL); los enlaces del storefront la incluyen. */
  readonly storeId = computed(() => this.productStore.storeId() ?? '');
  readonly storeName = computed(() => this.productStore.store()?.name ?? '');
  readonly homeLink = computed(() => (this.storeId() ? ['/tienda', this.storeId()] : ['/']));
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
  isDarkMode = signal(false);

  ngOnInit() {
    // Verificar si hay preferencia guardada o preferencia del sistema
    const savedTheme =
      typeof localStorage !== 'undefined' ? localStorage.getItem('ecom_theme') : null;
    const systemPrefersDark =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      this.isDarkMode.set(true);
      if (typeof document !== 'undefined') {
        document.documentElement.classList.add('dark');
      }
    }
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
