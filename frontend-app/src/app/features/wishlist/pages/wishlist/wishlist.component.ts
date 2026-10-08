import { Component, inject, signal, OnDestroy, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { WishlistStore } from '../../state/wishlist.store';
import { CartStore } from '../../../cart/public-api';
import { AuthStore } from '../../../auth/public-api';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { StarRatingComponent } from '../../../../shared/ui/star-rating/star-rating.component';
import { Product, ProductStore, ReviewsStore } from '../../../products/public-api';
import { QuickViewModalComponent } from '../../../products/public-ui';
import { SeoService } from '../../../../core/services/seo.service';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';

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
export class WishlistComponent implements OnDestroy {
  readonly wishlistStore = inject(WishlistStore);
  private readonly cartStore = inject(CartStore);
  private readonly authStore = inject(AuthStore);
  private readonly reviewsStore = inject(ReviewsStore);
  private readonly productStore = inject(ProductStore);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);

  /** Tienda activa (de la URL) para enlaces store-scoped. */
  readonly storeId = computed(() => this.productStore.storeId() ?? '');

  quickViewProduct = signal<Product | null>(null);

  constructor() {
    this.seoService.setPage('Lista de deseos', 'Tus productos favoritos en Quantum Store.');
  }

  ngOnDestroy(): void {
    this.seoService.reset();
  }

  /** Vista de cada producto para la plantilla (R-PF-4/R-SO-6). */
  readonly wishlistVms = computed(() =>
    this.wishlistStore.items().map((product) => ({
      product,
      avgRating: this.reviewsStore.getAverageRating(product.id),
      reviewCount: this.reviewsStore.getReviewsByProductId(product.id).length,
    })),
  );

  readonly quickViewVm = computed(() => {
    const product = this.quickViewProduct();
    if (!product) return null;
    return {
      product,
      isInWishlist: this.wishlistStore.isInWishlist(product.id),
      avgRating: this.reviewsStore.getAverageRating(product.id),
      reviewCount: this.reviewsStore.getReviewsByProductId(product.id).length,
    };
  });

  addToCart(product: Product): void {
    if (!this.authStore.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
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
