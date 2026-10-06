import {
  Component,
  inject,
  input,
  output,
  signal,
  HostListener,
  OnDestroy,
  effect,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { CartStore } from '../../../cart/state/cart.store';
import { WishlistStore } from '../../../wishlist/state/wishlist.store';
import { ReviewsStore } from '../../state/reviews.store';
import { CartFlyService } from '../../../../shared/ui/cart-fly/cart-fly.service';
import { StarRatingComponent } from '../../../../shared/ui/star-rating/star-rating.component';

@Component({
  selector: 'app-quick-view-modal',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink, StarRatingComponent],
  templateUrl: './quick-view-modal.component.html',
  styleUrl: './quick-view-modal.component.css',
})
export class QuickViewModalComponent implements OnDestroy {
  product = input<Product | null>(null);
  closeModal = output<void>();

  private readonly cartStore = inject(CartStore);
  private readonly wishlistStore = inject(WishlistStore);
  private readonly reviewsStore = inject(ReviewsStore);
  private readonly cartFlyService = inject(CartFlyService);

  isAdding = signal(false);

  constructor() {
    effect(() => {
      if (this.product()) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  get avgRating(): () => number {
    return () => (this.product() ? this.reviewsStore.getAverageRating(this.product()!.id) : 0);
  }

  get reviewCount(): () => number {
    return () =>
      this.product() ? this.reviewsStore.getReviewsByProductId(this.product()!.id).length : 0;
  }

  get isInWishlist(): () => boolean {
    return () => (this.product() ? this.wishlistStore.isInWishlist(this.product()!.id) : false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.product()) this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal.emit();
    }
  }

  onAddToCart(buttonEl: HTMLElement): void {
    const p = this.product();
    if (!p || this.isAdding()) return;
    this.isAdding.set(true);
    this.cartStore.addItem(p);
    this.cartFlyService.fly(buttonEl, p.imageUrl);
    setTimeout(() => this.isAdding.set(false), 2000);
  }

  toggleWishlist(): void {
    const p = this.product();
    if (p) this.wishlistStore.toggle(p);
  }
}
