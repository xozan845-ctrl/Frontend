import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { WishlistStore } from '../../state/wishlist/wishlist.store';
import { CartStore } from '../../../cart/public-api';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { StarRatingComponent } from '../../../../../shared/ui/star-rating/star-rating.component';
import { Product, ProductStore } from '../../../products/public-api';
import { QuickViewModalComponent } from '../../../products/public-ui';
import { injectSeoPage } from '../../../../../core/services/seo/seo.service';
import { AppCurrencyPipe } from '../../../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    RouterLink,
    NgOptimizedImage,
    EmptyStateComponent,
    StarRatingComponent,
    QuickViewModalComponent,
    AppCurrencyPipe,
  ],
  templateUrl: './wishlist.component.html',
})
export class WishlistComponent {
  readonly wishlistStore = inject(WishlistStore);
  private readonly cartStore = inject(CartStore);
  private readonly productStore = inject(ProductStore);
  private readonly seoService = injectSeoPage(
    'Lista de deseos',
    'Tus productos favoritos en Quantum Store.',
  );

  /** Tienda activa (de la URL) para enlaces store-scoped. */
  readonly storeId = computed(() => this.productStore.storeId() ?? '');

  quickViewProduct = signal<Product | null>(null);

  /** Vista de cada producto para la plantilla (R-PF-4/R-SO-6). */
  readonly wishlistVms = this.wishlistStore.wishlistVms;

  readonly quickViewVm = computed(() => {
    const product = this.quickViewProduct();
    if (!product) return null;
    const vm = this.wishlistVms().find((item) => String(item.product.id) === String(product.id));
    return vm ? { ...vm, isInWishlist: true } : null;
  });

  addToCart(product: Product): void {
    this.cartStore.addItem(product);
  }

  removeFromWishlist(productId: string | number): void {
    this.wishlistStore.removeItem(productId);
  }

  clearAll(): void {
    this.wishlistStore.items().forEach((p) => this.wishlistStore.removeItem(p.id));
  }

  openQuickView(product: Product): void {
    this.quickViewProduct.set(product);
  }
}

export default WishlistComponent;
