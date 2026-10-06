import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { WishlistStore } from './state/wishlist.store';
import { CartStore } from '../cart/state/cart.store';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { StarRatingComponent } from '../../shared/ui/star-rating/star-rating.component';
import { ReviewsStore } from '../products/state/reviews.store';
import { QuickViewModalComponent } from '../products/components/quick-view-modal/quick-view-modal.component';
import { Product } from '../products/models/product.model';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    RouterLink,
    NgOptimizedImage,
    EmptyStateComponent,
    StarRatingComponent,
    QuickViewModalComponent,
  ],
  templateUrl: './wishlist.component.html',
})
export class WishlistComponent {
  readonly wishlistStore = inject(WishlistStore);
  private readonly cartStore = inject(CartStore);
  private readonly reviewsStore = inject(ReviewsStore);

  quickViewProduct = signal<Product | null>(null);

  getAvgRating(productId: string | number): number {
    return this.reviewsStore.getAverageRating(productId);
  }

  getReviewCount(productId: string | number): number {
    return this.reviewsStore.getReviewsByProductId(productId).length;
  }

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
