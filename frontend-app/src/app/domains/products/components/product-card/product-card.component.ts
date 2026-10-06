import { Component, ElementRef, inject, input, output, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { Product } from '../../models/product.model';
import { NotificationService } from '../../../../shared/ui/notification/notification.service';
import { WishlistStore } from '../../../wishlist/state/wishlist.store';
import { ReviewsStore } from '../../state/reviews.store';
import { CartFlyService } from '../../../../shared/ui/cart-fly/cart-fly.service';
import { StarRatingComponent } from '../../../../shared/ui/star-rating/star-rating.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage, StarRatingComponent],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent {
  @ViewChild('productImage', { read: ElementRef }) productImageRef!: ElementRef<HTMLImageElement>;

  product = input.required<Product>();
  addToCart = output<Product>();
  quickView = output<Product>();

  private readonly notificationService = inject(NotificationService);
  private readonly wishlistStore = inject(WishlistStore);
  private readonly reviewsStore = inject(ReviewsStore);
  private readonly cartFlyService = inject(CartFlyService);

  isAdding = signal(false);

  get isInWishlist(): boolean {
    return this.wishlistStore.isInWishlist(this.product().id);
  }

  get avgRating(): number {
    return this.reviewsStore.getAverageRating(this.product().id);
  }

  get reviewCount(): number {
    return this.reviewsStore.getReviewsByProductId(this.product().id).length;
  }

  get discountPercent(): number | null {
    const orig = this.product().originalPrice;
    const price = this.product().price;
    if (orig && orig > price) {
      return Math.round(((orig - price) / orig) * 100);
    }
    return null;
  }

  toggleWishlist(): void {
    this.wishlistStore.toggle(this.product());
  }

  onAddToCart(buttonEl: HTMLButtonElement): void {
    if (this.isAdding()) return;
    this.isAdding.set(true);
    this.addToCart.emit(this.product());
    this.notificationService.showSuccess('Producto añadido al carrito');

    // Fly animation
    this.cartFlyService.fly(buttonEl, this.product().imageUrl);

    setTimeout(() => this.isAdding.set(false), 2000);
  }
}
